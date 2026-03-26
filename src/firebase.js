import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    getIdToken,
    
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    updateDoc,
    orderBy,
    serverTimestamp,
    deleteDoc,
    documentId,
    writeBatch,
    increment,
    runTransaction,
    limit,
    startAfter,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { v4 as uuidv4 } from 'uuid';

// --- firebaseConfig remains the same ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const functions = getFunctions(app);

const googleProvider = new GoogleAuthProvider();

// --- All auth functions (signInWithGoogle, logout, etc.) remain the same ---
const determineBranch = (email, emailConfig) => {
    // 1. Safety Check: If college hasn't set up rules yet
    if (!emailConfig || !emailConfig.indices || !emailConfig.mapping) {
        return "Unknown"; 
    }

    try {
        // 2. Get the username (e.g., "21mh1a0501" from "21mh1a0501@cvr.ac.in")
        const username = email.split('@')[0];
        
        // 3. Extract the specific digits based on the Admin's setup
        // emailConfig.indices might be [6, 7] (meaning 7th and 8th char)
        let extractedCode = "";
        
        // We use 'for...of' to handle the indices array
        for (const index of emailConfig.indices) {
            if (username[index]) {
                extractedCode += username[index];
            }
        }

        // 4. Check the mapping (e.g., does "05" exist in the mapping list?)
        const upperCode = extractedCode.toUpperCase();
        if (emailConfig.mapping[upperCode]) {
            return emailConfig.mapping[upperCode]; // Returns "CSE"
        } else {
            return "Unmapped Code (" + upperCode + ")";
        }

    } catch (err) {
        console.error("Branch extraction error:", err);
        return "Error";
    }
};

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const emailDomain = user.email.split('@')[1];
        const collegesRef = collection(db, "colleges");
        const q = query(collegesRef, where("domain", "==", emailDomain));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await signOut(auth);
            throw new Error(`Your college domain (${emailDomain}) is not registered on our platform.`);
        }

        const collegeData = querySnapshot.docs[0].data();
        const collegeId = querySnapshot.docs[0].id;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            // --- NEW: CALCULATE BRANCH ---
            const studentBranch = determineBranch(user.email, collegeData.emailConfig);

            await setDoc(userDocRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: "student",
                collegeId: collegeId,
                collegeName: collegeData.name,
                branch: studentBranch, // <--- SAVED HERE
                createdAt: new Date()
            });
        }
        return user;
    } catch (error) {
        console.error("Error during Google sign-in:", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

export const addCollege = async (name, domain, emailConfig) => {
    try {
        await addDoc(collection(db, 'colleges'), {
            name: name,
            domain: domain,
            emailConfig: emailConfig,
            festMode: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding college:", error);
        throw error;
    }
};

export const onCollegesUpdate = (callback) => {
    const collegesRef = collection(db, "colleges");
    const unsubscribe = onSnapshot(collegesRef, (snapshot) => {
        const collegesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(collegesList);
    });
    return unsubscribe;
};

export const signUpWithEmail = async (email, password) => {
    try {
        const emailDomain = email.split('@')[1];
        const collegesRef = collection(db, "colleges");
        const q = query(collegesRef, where("domain", "==", emailDomain));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error(`Your college domain (${emailDomain}) is not registered.`);
        }
        
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        await sendEmailVerification(result.user);
        
        const collegeData = querySnapshot.docs[0].data();
        const collegeId = querySnapshot.docs[0].id;

        // --- NEW: CALCULATE BRANCH ---
        const studentBranch = determineBranch(email, collegeData.emailConfig);

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: email.split('@')[0],
            email: user.email,
            photoURL: '',
            role: "student",
            collegeId: collegeId,
            collegeName: collegeData.name,
            branch: studentBranch, // <--- SAVED HERE
            createdAt: new Date()
        });
        return user;
    } catch (error) {
        console.error("Error during email sign-up:", error);
        throw error;
    }
}

export const resendVerificationEmail = () => {
    if (auth.currentUser) {
        return sendEmailVerification(auth.currentUser);
    }
    throw new Error("No user is currently signed in to resend verification email.");
};

export const signInWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error during email sign-in:", error);
        throw error;
    }
};

export const sendPasswordReset = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

export const updateUserProfile = async (userId, data) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, data);
    }
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data);
};

export const uploadProfileImage = async (file, userId) => {
    const fileRef = ref(storage, `profile-pictures/${userId}`);
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);
    return photoURL;
};

export const uploadEventPoster = async (file, eventId) => {
    const filePath = `event-posters/${eventId}/${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);
    return photoURL;
};

export const createEvent = async (eventData, posterFile) => {
    const eventId = uuidv4();
    try {
        const posterURL = await uploadEventPoster(posterFile, eventId);
        const finalEventData = {
            ...eventData,
            id: eventId,
            posterURL,
            createdAt: new Date(),
        };
        await setDoc(doc(db, "events", eventId), finalEventData);
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
};

export const getApprovedEventsByCollege = async (collegeId) => {
    if (!collegeId) return [];

    try {
        const eventsRef = collection(db, "events");
        
        // Use user's LOCAL time for accurate "upcoming" checks
        const todayString = new Date().toISOString().split('T')[0];

        // Query Firestore directly
        const q = query(
            eventsRef,
            where("collegeId", "==", collegeId),
            where("status", "==", "approved"),
            where("date", ">=", todayString),
            orderBy("date", "asc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
        console.error("Error fetching approved events:", error);
        throw error;
    }
};

export const getPendingEventsByCollege = async (collegeId) => {
    if (!collegeId) return [];
    try {
        const eventsRef = collection(db, "events");
        const q = query(
            eventsRef,
            where("collegeId", "==", collegeId),
            where("status", "==", "pending"),
            orderBy("createdAt", "asc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching pending events:", error);
        throw error;
    }
};

export const updateEventStatus = async (eventId, status) => {
    try {
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
            status: status
        });
    } catch (error) {
        console.error("Error updating event status:", error);
        throw error;
    }
};

// --- NEW REGISTRATION FUNCTIONS ---

// Helper function to log user activity
const logActivity = async (userId, activityData) => {
    try {
        const activitiesRef = collection(db, 'users', userId, 'activities');
        await addDoc(activitiesRef, {
            ...activityData,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging activity:", error);
        // Don't throw - activity logging is non-critical
    }
};

// Register a user for an event (Writes to both User and Event collections)
export const registerForEvent = async (eventId, userId, userDisplayName, eventTitle = '', eventPosterURL = '') => {
    const batch = writeBatch(db);

    // Get event data for organizer info
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    const eventData = eventSnap.data();
    const organizerId = eventData?.organizerId;

    // 1. Add to the Event's registration list (for organizers to see)
    const eventRegRef = doc(db, 'events', eventId, 'registrations', userId);
    batch.set(eventRegRef, {
        displayName: userDisplayName,
        registrationTime: serverTimestamp()
    });

    // 2. Add to the User's registration list (for the dashboard to see)
    const userRegRef = doc(db, 'users', userId, 'registrations', eventId);
    batch.set(userRegRef, {
        eventId: eventId,
        registrationTime: serverTimestamp()
    });

    await batch.commit();

    // Log activity
    await logActivity(userId, {
        type: 'register',
        eventId,
        eventTitle,
        eventPosterURL
    });

    // Send notification to event organizer (if not self-registration)
    if (organizerId && organizerId !== userId) {
        await createNotification(organizerId, {
            type: NOTIFICATION_TYPES.REGISTRATION,
            title: 'New Registration',
            message: `${userDisplayName} registered for your event`,
            eventId,
            eventTitle: eventTitle || eventData?.title || 'your event',
            actorId: userId,
            actorName: userDisplayName,
        });
    }
};

// Unregister a user from an event (Removes from both collections)
export const unregisterFromEvent = async (eventId, userId, eventTitle = '', eventPosterURL = '') => {
    const batch = writeBatch(db);

    // 1. Remove from Event's list
    const eventRegRef = doc(db, 'events', eventId, 'registrations', userId);
    batch.delete(eventRegRef);

    // 2. Remove from User's list
    const userRegRef = doc(db, 'users', userId, 'registrations', eventId);
    batch.delete(userRegRef);

    await batch.commit();

    // Log activity
    await logActivity(userId, {
        type: 'unregister',
        eventId,
        eventTitle,
        eventPosterURL
    });
};

// Listen ONLY to the events the specific user has registered for
export const onUserRegistrationsChange = (userId, callback) => {
    // This is the efficient listener! 
    // It only listens to "users/{userId}/registrations" (small), 
    // instead of "events" (potentially huge).
    const userRegistrationsRef = collection(db, 'users', userId, 'registrations');

    const unsubscribe = onSnapshot(userRegistrationsRef, (snapshot) => {
        const registeredEventIds = new Set();
        
        snapshot.forEach((doc) => {
            // The document ID is the eventId because of how we set it in registerForEvent
            registeredEventIds.add(doc.id);
        });

        callback(registeredEventIds);
    });

    return unsubscribe;
};

export const getEventsByIds = async (eventIds) => {
    if (!eventIds || eventIds.length === 0) {
        return [];
    }

    const eventsRef = collection(db, "events");
    const events = [];

    // Firestore 'in' queries are limited to 30 elements, so we chunk the array.
    const chunks = [];
    for (let i = 0; i < eventIds.length; i += 30) {
        chunks.push(eventIds.slice(i, i + 30));
    }

    try {
        const queryPromises = chunks.map(chunk => {
            const q = query(eventsRef, where(documentId(), 'in', chunk));
            return getDocs(q);
        });

        const querySnapshots = await Promise.all(queryPromises);

        querySnapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                events.push({ id: doc.id, ...doc.data() });
            });
        });

        return events;

    } catch (error) {
        console.error("Error fetching events by IDs:", error);
        throw error;
    }
};

export const generateAiPoster = async (promptData) => {
    try {
        const generateFunction = httpsCallable(functions, 'generateEventPoster');
        const result = await generateFunction(promptData);
        return result.data.imageUrl; // Returns the Base64 string
    } catch (error) {
        console.error("Error generating AI poster:", error);
        throw error;
    }
};

// ==================== SOCIAL FEATURES ====================

// --- LIKE FUNCTIONS ---

// Toggle like on an event (like if not liked, unlike if already liked)
export const toggleEventLike = async (eventId, userId, userDisplayName, userPhotoURL, eventTitle = '', eventPosterURL = '') => {
    const likeRef = doc(db, 'events', eventId, 'likes', userId);
    const eventRef = doc(db, 'events', eventId);

    try {
        const likeSnap = await getDoc(likeRef);
        const eventSnap = await getDoc(eventRef);
        const eventData = eventSnap.data();
        const organizerId = eventData?.organizerId;

        if (likeSnap.exists()) {
            // Unlike: remove like and decrement count
            const batch = writeBatch(db);
            batch.delete(likeRef);
            batch.update(eventRef, { likeCount: increment(-1) });
            await batch.commit();
            
            // Log unlike activity
            await logActivity(userId, {
                type: 'unlike',
                eventId,
                eventTitle,
                eventPosterURL
            });
            
            return false; // Now unliked
        } else {
            // Like: add like and increment count
            const batch = writeBatch(db);
            batch.set(likeRef, {
                displayName: userDisplayName,
                photoURL: userPhotoURL || '',
                likedAt: serverTimestamp()
            });
            batch.update(eventRef, { likeCount: increment(1) });
            await batch.commit();
            
            // Log like activity
            await logActivity(userId, {
                type: 'like',
                eventId,
                eventTitle,
                eventPosterURL
            });
            
            // Send notification to event organizer (if not self-like)
            if (organizerId && organizerId !== userId) {
                await createNotification(organizerId, {
                    type: NOTIFICATION_TYPES.LIKE,
                    title: 'New Like',
                    message: `${userDisplayName} liked your event`,
                    eventId,
                    eventTitle: eventTitle || eventData?.title || 'your event',
                    actorId: userId,
                    actorName: userDisplayName,
                    actorPhoto: userPhotoURL || '',
                });
            }
            
            return true; // Now liked
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

// Check if user has liked an event
export const checkUserLiked = async (eventId, userId) => {
    const likeRef = doc(db, 'events', eventId, 'likes', userId);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
};

// Get all users who liked an event
export const getEventLikes = async (eventId) => {
    const likesRef = collection(db, 'events', eventId, 'likes');
    const q = query(likesRef, orderBy('likedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Real-time listener for like status and count
export const onEventLikesChange = (eventId, userId, callback) => {
    const likeRef = doc(db, 'events', eventId, 'likes', userId);
    const eventRef = doc(db, 'events', eventId);

    // Listen to user's like status
    const unsubLike = onSnapshot(likeRef, (likeSnap) => {
        const isLiked = likeSnap.exists();
        callback({ isLiked });
    });

    // Listen to event's like count
    const unsubEvent = onSnapshot(eventRef, (eventSnap) => {
        if (eventSnap.exists()) {
            const likeCount = eventSnap.data().likeCount || 0;
            callback({ likeCount });
        }
    });

    return () => {
        unsubLike();
        unsubEvent();
    };
};

// --- COMMENT FUNCTIONS ---

// Add a comment to an event
export const addComment = async (eventId, userId, userDisplayName, userPhotoURL, text, parentId = null, eventTitle = '', eventPosterURL = '') => {
    const commentsRef = collection(db, 'events', eventId, 'comments');
    const eventRef = doc(db, 'events', eventId);

    try {
        const eventSnap = await getDoc(eventRef);
        const eventData = eventSnap.data();
        const organizerId = eventData?.organizerId;

        const commentData = {
            userId,
            displayName: userDisplayName,
            photoURL: userPhotoURL || '',
            text: text.trim(),
            parentId,
            createdAt: serverTimestamp(),
            updatedAt: null
        };

        const docRef = await addDoc(commentsRef, commentData);
        
        // Increment comment count on event
        await updateDoc(eventRef, { commentCount: increment(1) });

        // Log comment activity
        await logActivity(userId, {
            type: 'comment',
            eventId,
            eventTitle,
            eventPosterURL,
            metadata: {
                commentText: text.trim().substring(0, 100)
            }
        });

        // Send notification to event organizer (if not self-comment)
        if (organizerId && organizerId !== userId) {
            await createNotification(organizerId, {
                type: NOTIFICATION_TYPES.COMMENT,
                title: 'New Comment',
                message: `${userDisplayName}: "${text.trim().substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                eventId,
                eventTitle: eventTitle || eventData?.title || 'your event',
                actorId: userId,
                actorName: userDisplayName,
                actorPhoto: userPhotoURL || '',
            });
        }

        return { id: docRef.id, ...commentData };
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

// Edit a comment
export const editComment = async (eventId, commentId, newText) => {
    const commentRef = doc(db, 'events', eventId, 'comments', commentId);

    try {
        await updateDoc(commentRef, {
            text: newText.trim(),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error editing comment:", error);
        throw error;
    }
};

// Delete a comment (and its replies)
export const deleteComment = async (eventId, commentId) => {
    const commentRef = doc(db, 'events', eventId, 'comments', commentId);
    const commentsRef = collection(db, 'events', eventId, 'comments');
    const eventRef = doc(db, 'events', eventId);

    try {
        // Find all replies to this comment
        const repliesQuery = query(commentsRef, where('parentId', '==', commentId));
        const repliesSnap = await getDocs(repliesQuery);

        const batch = writeBatch(db);
        let deleteCount = 1; // The comment itself

        // Delete all replies
        repliesSnap.forEach((replyDoc) => {
            batch.delete(replyDoc.ref);
            deleteCount++;
        });

        // Delete the comment
        batch.delete(commentRef);

        // Decrement comment count
        batch.update(eventRef, { commentCount: increment(-deleteCount) });

        await batch.commit();
    } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
    }
};

// Get all comments for an event
export const getEventComments = async (eventId) => {
    const commentsRef = collection(db, 'events', eventId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Real-time listener for comments
export const onEventCommentsChange = (eventId, callback) => {
    const commentsRef = collection(db, 'events', eventId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(comments);
    });
};

// --- SHARE FUNCTIONS ---

// Generate shareable event URL
export const getEventShareUrl = (eventId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/event/${eventId}`;
};

// Generate share links for social platforms
export const getShareLinks = (eventId, eventTitle, eventDescription) => {
    const url = encodeURIComponent(getEventShareUrl(eventId));
    const title = encodeURIComponent(eventTitle);
    const text = encodeURIComponent(`Check out this event: ${eventTitle}`);
    const description = encodeURIComponent(eventDescription?.substring(0, 100) || '');

    return {
        twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        whatsapp: `https://wa.me/?text=${text}%20${url}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        copyUrl: getEventShareUrl(eventId)
    };
};

// ==================== BROWSE EVENTS ====================

// Browse all approved events with filters
export const browseEvents = async (filters = {}, lastDoc = null, pageSize = 12) => {
    const eventsRef = collection(db, 'events');
    const constraints = [where('status', '==', 'approved')];

    // Always filter out past events (unless explicit dateFrom is set)
    const todayString = new Date().toISOString().split('T')[0];
    
    // Apply filters
    if (filters.collegeId) {
        constraints.push(where('collegeId', '==', filters.collegeId));
    }

    if (filters.venue) {
        constraints.push(where('venue', '==', filters.venue));
    }

    // Price filter (free/paid)
    // Note: Only filter paid events in Firestore query; free events filtered client-side
    // to include events without isPaid field (legacy events are free by default)
    if (filters.priceFilter === 'paid') {
        constraints.push(where('isPaid', '==', true));
    }

    // Use dateFrom filter or default to today (no past events)
    if (filters.dateFrom) {
        constraints.push(where('date', '>=', filters.dateFrom));
    } else {
        constraints.push(where('date', '>=', todayString));
    }

    if (filters.dateTo) {
        constraints.push(where('date', '<=', filters.dateTo));
    }

    // Sorting
    if (filters.sortBy === 'popularity') {
        constraints.push(orderBy('likeCount', 'desc'));
    } else if (filters.sortBy === 'newest') {
        constraints.push(orderBy('createdAt', 'desc'));
    } else {
        // Default: sort by event date
        constraints.push(orderBy('date', 'asc'));
    }

    constraints.push(limit(pageSize));

    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    try {
        const q = query(eventsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
        
        return { events, lastVisible, hasMore: snapshot.docs.length === pageSize };
    } catch (error) {
        console.error("Error browsing events:", error);
        throw error;
    }
};

// Get all unique venues for filter dropdown
export const getUniqueVenues = async (collegeId = null) => {
    const eventsRef = collection(db, 'events');
    const constraints = [where('status', '==', 'approved')];
    
    if (collegeId) {
        constraints.push(where('collegeId', '==', collegeId));
    }
    
    try {
        const q = query(eventsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const venues = new Set();
        snapshot.docs.forEach(doc => {
            const venue = doc.data().venue;
            if (venue) venues.add(venue);
        });
        
        return Array.from(venues).sort();
    } catch (error) {
        console.error("Error getting venues:", error);
        return [];
    }
};

// Get all colleges for filter dropdown
export const getAllColleges = async () => {
    try {
        const collegesRef = collection(db, 'colleges');
        const snapshot = await getDocs(collegesRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting colleges:", error);
        return [];
    }
};

// Search events by title/description (client-side filtering for simplicity)
export const searchEvents = async (searchTerm, collegeId = null) => {
    const eventsRef = collection(db, 'events');
    const todayString = new Date().toISOString().split('T')[0];
    const constraints = [
        where('status', '==', 'approved'),
        where('date', '>=', todayString)
    ];
    
    if (collegeId) {
        constraints.push(where('collegeId', '==', collegeId));
    }
    
    constraints.push(orderBy('date', 'asc'));
    
    try {
        const q = query(eventsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const searchLower = searchTerm.toLowerCase();
        const events = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(event => 
                event.title?.toLowerCase().includes(searchLower) ||
                event.description?.toLowerCase().includes(searchLower) ||
                event.venue?.toLowerCase().includes(searchLower)
            );
        
        return events;
    } catch (error) {
        console.error("Error searching events:", error);
        throw error;
    }
};

// ==================== USER ACTIVITIES ====================

// Get user activities with pagination
export const getUserActivities = async (userId, lastDoc = null, pageSize = 20) => {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const constraints = [orderBy('timestamp', 'desc'), limit(pageSize)];
    
    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }
    
    try {
        const q = query(activitiesRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
        
        return { activities, lastVisible, hasMore: snapshot.docs.length === pageSize };
    } catch (error) {
        console.error("Error getting user activities:", error);
        throw error;
    }
};

// Real-time listener for user activities
export const onUserActivitiesChange = (userId, callback, limitCount = 20) => {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(activities);
    });
};

// ==================== PAYMENT FUNCTIONS ====================

// Helper to format price from paisa to rupees
export const formatPrice = (priceInPaisa) => {
    if (!priceInPaisa) return 'Free';
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
};

// Create a Razorpay order for an event
export const createRazorpayOrder = async (eventId, userId, userEmail, userName) => {
    try {
        // Get event details
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        const event = eventSnap.data();
        
        if (!event.isPaid) {
            throw new Error('This is a free event');
        }
        
        // Check capacity
        if (event.hasCapacity && event.registrationCount >= event.maxCapacity) {
            throw new Error('Event is sold out');
        }
        
        // Create a payment record in Firestore
        const paymentId = uuidv4();
        const paymentData = {
            id: paymentId,
            eventId,
            eventTitle: event.title,
            userId,
            userEmail,
            userName,
            amount: event.price, // in paisa
            status: 'pending',
            createdAt: serverTimestamp(),
        };
        
        // Save to both collections
        const batch = writeBatch(db);
        batch.set(doc(db, 'events', eventId, 'payments', paymentId), paymentData);
        batch.set(doc(db, 'users', userId, 'payments', paymentId), paymentData);
        await batch.commit();
        
        // Return data needed for Razorpay checkout
        return {
            paymentId,
            amount: event.price,
            eventTitle: event.title,
            eventId,
            currency: 'INR',
            prefill: {
                email: userEmail,
                name: userName,
            }
        };
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

// Verify and complete payment
export const verifyPayment = async (paymentId, eventId, userId, razorpayPaymentId, razorpayOrderId, razorpaySignature) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        const event = eventSnap.data();
        
        // Check capacity again before completing
        if (event.hasCapacity && event.registrationCount >= event.maxCapacity) {
            // Refund logic would go here in production
            throw new Error('Event is sold out. Payment will be refunded.');
        }
        
        const batch = writeBatch(db);
        
        // Update payment status
        const paymentUpdate = {
            status: 'success',
            razorpayPaymentId,
            razorpayOrderId: razorpayOrderId || null,
            razorpaySignature: razorpaySignature || null,
            completedAt: serverTimestamp(),
        };
        
        batch.update(doc(db, 'events', eventId, 'payments', paymentId), paymentUpdate);
        batch.update(doc(db, 'users', userId, 'payments', paymentId), paymentUpdate);
        
        // Create registration
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        batch.set(doc(db, 'events', eventId, 'registrations', userId), {
            displayName: userData.displayName || 'Anonymous',
            email: userData.email,
            registrationTime: serverTimestamp(),
            paymentId,
            paidAmount: event.price,
        });
        
        batch.set(doc(db, 'users', userId, 'registrations', eventId), {
            registrationTime: serverTimestamp(),
            paymentId,
            paidAmount: event.price,
        });
        
        // Increment registration count
        batch.update(eventRef, {
            registrationCount: increment(1)
        });
        
        await batch.commit();
        
        // Log activity
        await logActivity(userId, {
            type: 'payment',
            eventId,
            eventTitle: event.title,
            amount: event.price,
            message: `Paid ₹${event.price / 100} and registered for ${event.title}`,
        });
        
        // Send payment success notification to payer
        await createNotification(userId, {
            type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
            title: 'Payment Successful',
            message: `Your payment of ₹${event.price / 100} for ${event.title} was successful`,
            eventId,
            eventTitle: event.title,
        });
        
        // Send registration notification to organizer
        const organizerId = event.organizerId;
        if (organizerId && organizerId !== userId) {
            await createNotification(organizerId, {
                type: NOTIFICATION_TYPES.REGISTRATION,
                title: 'New Paid Registration',
                message: `${userData.displayName || 'Someone'} paid ₹${event.price / 100} and registered`,
                eventId,
                eventTitle: event.title,
                actorId: userId,
                actorName: userData.displayName || 'Anonymous',
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
};

// Mark payment as failed
export const markPaymentFailed = async (paymentId, eventId, userId, errorMessage) => {
    try {
        const batch = writeBatch(db);
        
        const failedUpdate = {
            status: 'failed',
            errorMessage,
            failedAt: serverTimestamp(),
        };
        
        batch.update(doc(db, 'events', eventId, 'payments', paymentId), failedUpdate);
        batch.update(doc(db, 'users', userId, 'payments', paymentId), failedUpdate);
        
        await batch.commit();
    } catch (error) {
        console.error('Error marking payment as failed:', error);
    }
};

// Get user payment history
export const getUserPayments = async (userId, lastDoc = null, pageSize = 20) => {
    const paymentsRef = collection(db, 'users', userId, 'payments');
    const constraints = [orderBy('createdAt', 'desc'), limit(pageSize)];
    
    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }
    
    try {
        const q = query(paymentsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
        
        return { payments, lastVisible, hasMore: snapshot.docs.length === pageSize };
    } catch (error) {
        console.error('Error getting user payments:', error);
        throw error;
    }
};

// Get event payments (for organizers)
export const getEventPayments = async (eventId, lastDoc = null, pageSize = 50) => {
    const paymentsRef = collection(db, 'events', eventId, 'payments');
    const constraints = [orderBy('createdAt', 'desc'), limit(pageSize)];
    
    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }
    
    try {
        const q = query(paymentsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
        
        // Calculate totals
        const successfulPayments = payments.filter(p => p.status === 'success');
        const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        return { 
            payments, 
            lastVisible, 
            hasMore: snapshot.docs.length === pageSize,
            stats: {
                totalPayments: payments.length,
                successfulPayments: successfulPayments.length,
                totalRevenue,
            }
        };
    } catch (error) {
        console.error('Error getting event payments:', error);
        throw error;
    }
};

// Process refund (for organizers)
export const processRefund = async (paymentId, eventId, userId, refundReason) => {
    try {
        // Get event to check refund policy
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        const event = eventSnap.data();
        
        if (event.refundPolicy === 'no_refund') {
            throw new Error('This event does not allow refunds');
        }
        
        const batch = writeBatch(db);
        
        const refundUpdate = {
            status: 'refunded',
            refundedAt: serverTimestamp(),
            refundReason,
        };
        
        batch.update(doc(db, 'events', eventId, 'payments', paymentId), refundUpdate);
        batch.update(doc(db, 'users', userId, 'payments', paymentId), refundUpdate);
        
        // Remove registration
        batch.delete(doc(db, 'events', eventId, 'registrations', userId));
        batch.delete(doc(db, 'users', userId, 'registrations', eventId));
        
        // Decrement registration count
        batch.update(eventRef, {
            registrationCount: increment(-1)
        });
        
        await batch.commit();
        
        // Log activity
        await logActivity(userId, {
            type: 'refund',
            eventId,
            eventTitle: event.title,
            message: `Refund processed for ${event.title}`,
        });
        
        // Get payment details for amount
        const paymentRef = doc(db, 'events', eventId, 'payments', paymentId);
        const paymentSnap = await getDoc(paymentRef);
        const paymentData = paymentSnap.data();
        const amount = paymentData?.amount || event.price;
        
        // Send refund notification to user
        await createNotification(userId, {
            type: NOTIFICATION_TYPES.PAYMENT_REFUND,
            title: 'Refund Processed',
            message: `Your refund of ₹${amount / 100} for ${event.title} has been processed`,
            eventId,
            eventTitle: event.title,
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
};

// Check if event is sold out
export const isEventSoldOut = (event) => {
    if (!event.hasCapacity) return false;
    return event.registrationCount >= event.maxCapacity;
};

// Get remaining spots
export const getRemainingSpots = (event) => {
    if (!event.hasCapacity) return null;
    return Math.max(0, event.maxCapacity - (event.registrationCount || 0));
};

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

// Notification types
export const NOTIFICATION_TYPES = {
    EVENT_UPDATE: 'event_update',
    EVENT_CANCELLED: 'event_cancelled',
    EVENT_REMINDER: 'event_reminder',
    LIKE: 'like',
    COMMENT: 'comment',
    REGISTRATION: 'registration',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_REFUND: 'payment_refund',
};

// Create a notification for a user
export const createNotification = async (userId, data) => {
    try {
        const notificationRef = collection(db, 'users', userId, 'notifications');
        const notification = {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        };
        await addDoc(notificationRef, notification);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Create notifications for multiple users (e.g., all registered users for an event)
export const createBulkNotifications = async (userIds, data) => {
    try {
        const batch = writeBatch(db);
        const notification = {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        };
        
        userIds.forEach(userId => {
            const notifRef = doc(collection(db, 'users', userId, 'notifications'));
            batch.set(notifRef, notification);
        });
        
        await batch.commit();
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
    }
};

// Get user notifications with real-time listener
export const subscribeToNotifications = (userId, callback) => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(notifications);
    }, (error) => {
        console.error('Error subscribing to notifications:', error);
        callback([]);
    });
};

// Mark a single notification as read
export const markNotificationRead = async (userId, notificationId) => {
    try {
        const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
        await updateDoc(notifRef, { read: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (userId) => {
    try {
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const q = query(notificationsRef, where('read', '==', false));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

// Delete a single notification
export const deleteNotification = async (userId, notificationId) => {
    try {
        const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
        await deleteDoc(notifRef);
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
};

// Clear all notifications for a user
export const clearAllNotifications = async (userId) => {
    try {
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const snapshot = await getDocs(notificationsRef);
        
        if (snapshot.empty) return;
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
};

// Get all registered user IDs for an event (for sending notifications)
export const getEventRegisteredUserIds = async (eventId) => {
    try {
        const regsRef = collection(db, 'events', eventId, 'registrations');
        const snapshot = await getDocs(regsRef);
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Error getting registered users:', error);
        return [];
    }
};

// Notify all registered users about event update
export const notifyEventUpdate = async (eventId, eventTitle, updateMessage) => {
    try {
        const userIds = await getEventRegisteredUserIds(eventId);
        if (userIds.length === 0) return;
        
        await createBulkNotifications(userIds, {
            type: NOTIFICATION_TYPES.EVENT_UPDATE,
            title: 'Event Updated',
            message: updateMessage || `${eventTitle} has been updated`,
            eventId,
            eventTitle,
        });
    } catch (error) {
        console.error('Error notifying event update:', error);
    }
};

// Notify all registered users about event cancellation
export const notifyEventCancelled = async (eventId, eventTitle, reason = '') => {
    try {
        const userIds = await getEventRegisteredUserIds(eventId);
        if (userIds.length === 0) return;
        
        await createBulkNotifications(userIds, {
            type: NOTIFICATION_TYPES.EVENT_CANCELLED,
            title: 'Event Cancelled',
            message: reason || `${eventTitle} has been cancelled`,
            eventId,
            eventTitle,
        });
    } catch (error) {
        console.error('Error notifying event cancellation:', error);
    }
};