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
    serverTimestamp, // New import
    deleteDoc,       // New import'
    documentId,
    writeBatch,
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

// Register a user for an event
// --- UPDATED REGISTRATION FUNCTIONS ---

// Register a user for an event (Writes to both User and Event collections)
export const registerForEvent = async (eventId, userId, userDisplayName) => {
    const batch = writeBatch(db);

    // 1. Add to the Event's registration list (for organizers to see)
    const eventRegRef = doc(db, 'events', eventId, 'registrations', userId);
    batch.set(eventRegRef, {
        displayName: userDisplayName,
        registrationTime: serverTimestamp()
    });

    // 2. Add to the User's registration list (for the dashboard to see)
    // We use the eventId as the document ID for easy lookup
    const userRegRef = doc(db, 'users', userId, 'registrations', eventId);
    batch.set(userRegRef, {
        eventId: eventId,
        registrationTime: serverTimestamp()
    });

    await batch.commit();
};

// Unregister a user from an event (Removes from both collections)
export const unregisterFromEvent = async (eventId, userId) => {
    const batch = writeBatch(db);

    // 1. Remove from Event's list
    const eventRegRef = doc(db, 'events', eventId, 'registrations', userId);
    batch.delete(eventRegRef);

    // 2. Remove from User's list
    const userRegRef = doc(db, 'users', userId, 'registrations', eventId);
    batch.delete(userRegRef);

    await batch.commit();
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
