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
    arrayUnion,
    arrayRemove,
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

// ============================================
// SUPER ADMIN FUNCTIONS
// ============================================

// Get platform-wide statistics
export const getPlatformStats = async () => {
    try {
        const [usersSnap, eventsSnap, clubsSnap, collegesSnap] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'events')),
            getDocs(collection(db, 'clubs')),
            getDocs(collection(db, 'colleges'))
        ]);

        const activeColleges = collegesSnap.docs.filter(d => d.data().status !== 'inactive').length;
        const approvedEvents = eventsSnap.docs.filter(d => d.data().status === 'approved').length;
        const pendingEvents = eventsSnap.docs.filter(d => d.data().status === 'pending').length;
        const activeClubs = clubsSnap.docs.filter(d => d.data().status === 'active').length;

        return {
            totalUsers: usersSnap.size,
            totalEvents: eventsSnap.size,
            approvedEvents,
            pendingEvents,
            totalClubs: clubsSnap.size,
            activeClubs,
            totalColleges: collegesSnap.size,
            activeColleges
        };
    } catch (error) {
        console.error('Error getting platform stats:', error);
        throw error;
    }
};

// Get all colleges with their stats
export const getAllCollegesWithStats = async () => {
    try {
        const collegesSnap = await getDocs(collection(db, 'colleges'));
        const colleges = [];

        for (const collegeDoc of collegesSnap.docs) {
            const collegeData = { id: collegeDoc.id, ...collegeDoc.data() };
            
            // Get user count for this college
            const usersQ = query(collection(db, 'users'), where('collegeId', '==', collegeDoc.id));
            const usersSnap = await getDocs(usersQ);
            
            // Get event count for this college
            const eventsQ = query(collection(db, 'events'), where('collegeId', '==', collegeDoc.id));
            const eventsSnap = await getDocs(eventsQ);
            
            // Get club count for this college
            const clubsQ = query(collection(db, 'clubs'), where('collegeId', '==', collegeDoc.id));
            const clubsSnap = await getDocs(clubsQ);

            colleges.push({
                ...collegeData,
                stats: {
                    users: usersSnap.size,
                    events: eventsSnap.size,
                    clubs: clubsSnap.size
                }
            });
        }

        return colleges;
    } catch (error) {
        console.error('Error getting colleges with stats:', error);
        throw error;
    }
};

// Update college details
export const updateCollegeDetails = async (collegeId, updates) => {
    try {
        const collegeRef = doc(db, 'colleges', collegeId);
        await updateDoc(collegeRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating college:', error);
        throw error;
    }
};

// Soft delete/restore college
export const setCollegeStatus = async (collegeId, active) => {
    try {
        const collegeRef = doc(db, 'colleges', collegeId);
        await updateDoc(collegeRef, {
            status: active ? 'active' : 'inactive',
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error setting college status:', error);
        throw error;
    }
};

// Get all college admins across platform
export const getAllCollegeAdmins = async () => {
    try {
        const adminsQ = query(collection(db, 'users'), where('role', '==', 'collegeAdmin'));
        const snapshot = await getDocs(adminsQ);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));
    } catch (error) {
        console.error('Error getting college admins:', error);
        throw error;
    }
};

// Create admin invite
export const inviteCollegeAdmin = async (email, collegeId, collegeName, invitedByName) => {
    try {
        // Check if invite already exists
        const existingQ = query(
            collection(db, 'adminInvites'),
            where('email', '==', email),
            where('status', '==', 'pending')
        );
        const existing = await getDocs(existingQ);
        if (!existing.empty) {
            throw new Error('An invite for this email already exists');
        }

        // Check if user already exists with this email
        const usersQ = query(collection(db, 'users'), where('email', '==', email));
        const existingUser = await getDocs(usersQ);
        if (!existingUser.empty) {
            throw new Error('A user with this email already exists');
        }

        // Generate secure token
        const token = uuidv4();
        
        await addDoc(collection(db, 'adminInvites'), {
            email,
            collegeId,
            collegeName,
            token,
            invitedBy: invitedByName,
            status: 'pending',
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        // Log audit action
        await logAuditAction('system', 'Admin', 'invite_admin', {
            email,
            collegeId,
            collegeName
        });

        return { success: true, token };
    } catch (error) {
        console.error('Error inviting college admin:', error);
        throw error;
    }
};

// Verify admin invite token
export const verifyAdminInvite = async (token) => {
    try {
        const invitesQ = query(
            collection(db, 'adminInvites'),
            where('token', '==', token),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(invitesQ);
        
        if (snapshot.empty) {
            return { valid: false, error: 'Invalid or expired invite' };
        }

        const invite = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        
        // Check expiration
        const expiresAt = invite.expiresAt?.toDate?.() || new Date(invite.expiresAt);
        if (expiresAt < new Date()) {
            return { valid: false, error: 'Invite has expired' };
        }

        return { valid: true, invite };
    } catch (error) {
        console.error('Error verifying invite:', error);
        throw error;
    }
};

// Complete admin setup (called after Firebase Auth user is created)
export const completeAdminSetup = async (token, userId, displayName) => {
    try {
        // Get and verify invite
        const { valid, invite, error } = await verifyAdminInvite(token);
        if (!valid) {
            throw new Error(error);
        }

        // Create user document with collegeAdmin role
        await setDoc(doc(db, 'users', userId), {
            uid: userId,
            displayName,
            email: invite.email,
            photoURL: '',
            role: 'collegeAdmin',
            collegeId: invite.collegeId,
            collegeName: invite.collegeName,
            createdAt: serverTimestamp(),
            invitedBy: invite.invitedBy
        });

        // Mark invite as completed
        const inviteRef = doc(db, 'adminInvites', invite.id);
        await updateDoc(inviteRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            userId
        });

        // Log audit action
        await logAuditAction(userId, displayName, 'admin_setup_complete', {
            collegeId: invite.collegeId,
            collegeName: invite.collegeName
        });

        return { success: true };
    } catch (error) {
        console.error('Error completing admin setup:', error);
        throw error;
    }
};

// Get pending admin invites
export const getPendingAdminInvites = async () => {
    try {
        const invitesQ = query(
            collection(db, 'adminInvites'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(invitesQ);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt
        }));
    } catch (error) {
        console.error('Error getting pending invites:', error);
        throw error;
    }
};

// Cancel admin invite
export const cancelAdminInvite = async (inviteId) => {
    try {
        const inviteRef = doc(db, 'adminInvites', inviteId);
        await updateDoc(inviteRef, {
            status: 'cancelled',
            cancelledAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error cancelling invite:', error);
        throw error;
    }
};

// Revoke college admin (demote to faculty)
export const revokeCollegeAdmin = async (userId, revokedByName) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const userData = userSnap.data();
        
        await updateDoc(userRef, {
            role: 'faculty',
            revokedAt: serverTimestamp(),
            revokedBy: revokedByName
        });

        // Log audit action
        await logAuditAction('system', revokedByName, 'revoke_admin', {
            userId,
            userName: userData.displayName,
            collegeId: userData.collegeId
        });

        return { success: true };
    } catch (error) {
        console.error('Error revoking admin:', error);
        throw error;
    }
};

// Log audit action
export const logAuditAction = async (userId, userName, action, details = {}) => {
    try {
        await addDoc(collection(db, 'auditLogs'), {
            userId,
            userName,
            action,
            details,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging audit action:', error);
        // Don't throw - audit logging should not break main operations
    }
};

// Get audit logs with filtering
export const getAuditLogs = async (filters = {}, limitCount = 50) => {
    try {
        let q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
        
        // Note: Firestore doesn't support multiple inequality filters
        // For complex filtering, we'll do client-side filtering
        const snapshot = await getDocs(q);
        
        let logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
        }));

        // Client-side filtering
        if (filters.action) {
            logs = logs.filter(log => log.action === filters.action);
        }
        if (filters.collegeId) {
            logs = logs.filter(log => log.details?.collegeId === filters.collegeId);
        }

        return logs;
    } catch (error) {
        console.error('Error getting audit logs:', error);
        throw error;
    }
};

// Get recent platform activity
export const getRecentActivity = async (limitCount = 10) => {
    try {
        // Get recent users
        const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
        const usersSnap = await getDocs(usersQ);
        
        // Get recent events
        const eventsQ = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(5));
        const eventsSnap = await getDocs(eventsQ);

        const activity = [];

        usersSnap.docs.forEach(doc => {
            const data = doc.data();
            activity.push({
                type: 'user_signup',
                message: `${data.displayName || data.email} joined ${data.collegeName || 'the platform'}`,
                timestamp: data.createdAt?.toDate?.() || new Date(),
                collegeId: data.collegeId
            });
        });

        eventsSnap.docs.forEach(doc => {
            const data = doc.data();
            activity.push({
                type: 'event_created',
                message: `Event "${data.title}" created at ${data.collegeName || 'unknown college'}`,
                timestamp: data.createdAt?.toDate?.() || new Date(),
                collegeId: data.collegeId
            });
        });

        // Sort by timestamp and limit
        return activity
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limitCount);
    } catch (error) {
        console.error('Error getting recent activity:', error);
        throw error;
    }
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

// Generic image upload function
export const uploadImage = async (file, path) => {
    const fileRef = ref(storage, path);
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
            status: status,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating event status:", error);
        throw error;
    }
};

// Delete event (college admin function)
export const deleteEvent = async (eventId) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        await deleteDoc(eventRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

// Update event details (college admin function)
export const updateEvent = async (eventId, eventData) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
            ...eventData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

// Update club status (college admin function)
export const updateClubStatus = async (clubId, status) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        await updateDoc(clubRef, {
            status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating club status:', error);
        throw error;
    }
};

// Assign faculty coordinator to club (college admin function)
export const assignFacultyToClub = async (clubId, facultyId) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        await updateDoc(clubRef, {
            facultyCoordinatorId: facultyId,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error assigning faculty to club:', error);
        throw error;
    }
};

// ========== FEST MANAGEMENT FUNCTIONS ==========

// Create a new fest
export const createFest = async (festData) => {
    try {
        const festRef = await addDoc(collection(db, 'fests'), {
            ...festData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: festRef.id };
    } catch (error) {
        console.error('Error creating fest:', error);
        throw error;
    }
};

// Get all fests for a college
export const getFestsByCollege = async (collegeId) => {
    try {
        const festsRef = collection(db, 'fests');
        const q = query(festsRef, where('collegeId', '==', collegeId), orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate(),
            endDate: doc.data().endDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate()
        }));
    } catch (error) {
        console.error('Error getting fests:', error);
        throw error;
    }
};

// Update fest
export const updateFest = async (festId, updateData) => {
    try {
        const festRef = doc(db, 'fests', festId);
        await updateDoc(festRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating fest:', error);
        throw error;
    }
};

// Delete fest
export const deleteFest = async (festId) => {
    try {
        const festRef = doc(db, 'fests', festId);
        await deleteDoc(festRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting fest:', error);
        throw error;
    }
};

// Add coordinator to fest
export const addCoordinatorToFest = async (festId, coordinatorId, coordinatorType) => {
    try {
        const festRef = doc(db, 'fests', festId);
        const field = coordinatorType === 'faculty' ? 'facultyCoordinators' : 'studentCoordinators';
        
        await updateDoc(festRef, {
            [field]: arrayUnion(coordinatorId),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error adding coordinator:', error);
        throw error;
    }
};

// Remove coordinator from fest
export const removeCoordinatorFromFest = async (festId, coordinatorId, coordinatorType) => {
    try {
        const festRef = doc(db, 'fests', festId);
        const field = coordinatorType === 'faculty' ? 'facultyCoordinators' : 'studentCoordinators';
        
        await updateDoc(festRef, {
            [field]: arrayRemove(coordinatorId),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error removing coordinator:', error);
        throw error;
    }
};

// --- FEST FUNCTIONS FOR STUDENTS & FACULTY ---

// Get fests visible to a student (filtered by college and branch)
export const getFestsForStudent = async (collegeId, userBranch) => {
    try {
        const festsRef = collection(db, 'fests');
        // Get all fests for this college + fests allowing other colleges
        const q = query(festsRef, where('collegeId', '==', collegeId), orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        
        const fests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate(),
            endDate: doc.data().endDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate()
        }));
        
        // Filter by branch visibility
        return fests.filter(fest => {
            // College-wide fests are visible to all
            if (fest.scope === 'college') return true;
            // Branch-specific fests only visible to matching branch
            if (fest.scope === 'branch' && fest.branchName) {
                return fest.branchName === userBranch;
            }
            return true;
        });
    } catch (error) {
        console.error('Error getting fests for student:', error);
        throw error;
    }
};

// Get a single fest by ID
export const getFestById = async (festId) => {
    try {
        const festRef = doc(db, 'fests', festId);
        const snapshot = await getDoc(festRef);
        if (snapshot.exists()) {
            const data = snapshot.data();
            return {
                id: snapshot.id,
                ...data,
                startDate: data.startDate?.toDate(),
                endDate: data.endDate?.toDate(),
                createdAt: data.createdAt?.toDate()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting fest:', error);
        throw error;
    }
};

// Get events linked to a fest
export const getFestEvents = async (festId, includeAll = false) => {
    try {
        const eventsRef = collection(db, 'events');
        let q;
        if (includeAll) {
            // For coordinators - show all including pending
            q = query(eventsRef, where('festId', '==', festId), orderBy('date', 'asc'));
        } else {
            // For students - only approved events
            q = query(eventsRef, where('festId', '==', festId), where('status', '==', 'approved'), orderBy('date', 'asc'));
        }
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            let eventDate = data.date;
            if (eventDate?.toDate) {
                eventDate = eventDate.toDate();
            } else if (eventDate) {
                eventDate = new Date(eventDate);
            }
            return {
                id: doc.id,
                ...data,
                date: eventDate,
                createdAt: data.createdAt?.toDate?.() || data.createdAt
            };
        });
    } catch (error) {
        console.error('Error getting fest events:', error);
        throw error;
    }
};

// Submit an event for a fest (creates pending event)
export const submitEventForFest = async (eventData, festId, festName) => {
    try {
        const eventsRef = collection(db, 'events');
        const newEvent = {
            ...eventData,
            festId,
            festName,
            status: 'pending', // Requires approval
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(eventsRef, newEvent);
        return { id: docRef.id, ...newEvent };
    } catch (error) {
        console.error('Error submitting event for fest:', error);
        throw error;
    }
};

// Get fests where user is a coordinator (faculty or student)
export const getFacultyFests = async (userId) => {
    try {
        const festsRef = collection(db, 'fests');
        // Check faculty coordinators
        const facultyQuery = query(festsRef, where('facultyCoordinators', 'array-contains', userId));
        const facultySnapshot = await getDocs(facultyQuery);
        
        // Check student coordinators
        const studentQuery = query(festsRef, where('studentCoordinators', 'array-contains', userId));
        const studentSnapshot = await getDocs(studentQuery);
        
        // Combine and dedupe
        const festsMap = new Map();
        
        [...facultySnapshot.docs, ...studentSnapshot.docs].forEach(doc => {
            if (!festsMap.has(doc.id)) {
                const data = doc.data();
                festsMap.set(doc.id, {
                    id: doc.id,
                    ...data,
                    startDate: data.startDate?.toDate(),
                    endDate: data.endDate?.toDate(),
                    createdAt: data.createdAt?.toDate()
                });
            }
        });
        
        return Array.from(festsMap.values());
    } catch (error) {
        console.error('Error getting faculty fests:', error);
        throw error;
    }
};

// Get pending events for a fest (for coordinators to approve)
export const getPendingFestEvents = async (festId) => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(
            eventsRef, 
            where('festId', '==', festId), 
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            createdAt: doc.data().createdAt?.toDate()
        }));
    } catch (error) {
        console.error('Error getting pending fest events:', error);
        throw error;
    }
};

// Get pending club events (for club coordinator approval)
export const getPendingClubEvents = async (clubId) => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(
            eventsRef, 
            where('clubId', '==', clubId), 
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            let eventDate = data.date;
            if (eventDate?.toDate) {
                eventDate = eventDate.toDate();
            } else if (eventDate) {
                eventDate = new Date(eventDate);
            }
            return {
                id: doc.id,
                ...data,
                date: eventDate,
                createdAt: data.createdAt?.toDate?.() || data.createdAt
            };
        });
    } catch (error) {
        console.error('Error getting pending club events:', error);
        throw error;
    }
};

// Approve a fest/club event submission
export const approveFestEvent = async (eventId) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        
        // Get event data first to send notification
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        const eventData = eventSnap.data();
        
        await updateDoc(eventRef, {
            status: 'approved',
            approvedAt: serverTimestamp()
        });
        
        // Send notification to event organizer
        const organizerId = eventData.organizerId || eventData.createdBy;
        if (organizerId) {
            const contextName = eventData.festName || eventData.clubName || '';
            try {
                await createNotification(organizerId, {
                    type: 'event_approved',
                    title: 'Event Approved! 🎉',
                    message: `Your event "${eventData.title}"${contextName ? ` for ${contextName}` : ''} has been approved and is now live!`,
                    eventId: eventId,
                    eventTitle: eventData.title,
                    link: `/event/${eventId}`
                });
            } catch (notifError) {
                console.error('Failed to send approval notification:', notifError);
            }
        } else {
            console.warn('No organizerId found for event:', eventId);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error approving fest event:', error);
        throw error;
    }
};

// Reject a fest/club event submission
export const rejectFestEvent = async (eventId, reason = '') => {
    try {
        const eventRef = doc(db, 'events', eventId);
        
        // Get event data first to send notification
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        const eventData = eventSnap.data();
        
        await updateDoc(eventRef, {
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: serverTimestamp()
        });
        
        // Send notification to event organizer
        const organizerId = eventData.organizerId || eventData.createdBy;
        if (organizerId) {
            const contextName = eventData.festName || eventData.clubName || '';
            try {
                await createNotification(organizerId, {
                    type: 'event_rejected',
                    title: 'Event Not Approved',
                    message: `Your event "${eventData.title}"${contextName ? ` for ${contextName}` : ''} was not approved.${reason ? ` Reason: ${reason}` : ''}`,
                    eventId: eventId,
                    eventTitle: eventData.title,
                    link: `/event/${eventId}`
                });
            } catch (notifError) {
                console.error('Failed to send rejection notification:', notifError);
            }
        } else {
            console.warn('No organizerId found for event:', eventId);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error rejecting fest event:', error);
        throw error;
    }
};

// Get fest stats for coordinator dashboard
export const getFestStats = async (festId) => {
    try {
        // Get all events for this fest
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(eventsRef, where('festId', '==', festId));
        const eventsSnapshot = await getDocs(eventsQuery);
        
        let totalEvents = 0;
        let pendingEvents = 0;
        let approvedEvents = 0;
        let totalRegistrations = 0;
        
        for (const eventDoc of eventsSnapshot.docs) {
            totalEvents++;
            const data = eventDoc.data();
            if (data.status === 'pending') pendingEvents++;
            if (data.status === 'approved') approvedEvents++;
            totalRegistrations += data.registrationCount || 0;
        }
        
        return {
            totalEvents,
            pendingEvents,
            approvedEvents,
            totalRegistrations
        };
    } catch (error) {
        console.error('Error getting fest stats:', error);
        return { totalEvents: 0, pendingEvents: 0, approvedEvents: 0, totalRegistrations: 0 };
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

// Get a single college by ID
export const getCollegeById = async (collegeId) => {
    try {
        const collegeRef = doc(db, 'colleges', collegeId);
        const snapshot = await getDoc(collegeRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting college:", error);
        return null;
    }
};

// Get a single user by ID
export const getUserById = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting user:", error);
        return null;
    }
};

// Get all users from a specific college
export const getUsersByCollege = async (collegeId, filters = {}) => {
    try {
        const usersRef = collection(db, 'users');
        const constraints = [where('collegeId', '==', collegeId)];
        
        // Apply role filter if provided
        if (filters.role && filters.role !== 'all') {
            constraints.push(where('role', '==', filters.role));
        }
        
        const q = query(usersRef, ...constraints);
        const snapshot = await getDocs(q);
        
        let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Client-side filtering for search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            users = users.filter(u => 
                u.displayName?.toLowerCase().includes(searchLower) ||
                u.email?.toLowerCase().includes(searchLower)
            );
        }
        
        return users;
    } catch (error) {
        console.error('Error getting users by college:', error);
        throw error;
    }
};

// Assign role to a user (college admin function)
export const assignUserRole = async (userId, newRole, collegeId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        // Verify user belongs to the college
        if (userDoc.data().collegeId !== collegeId) {
            throw new Error('User does not belong to this college');
        }
        
        // Update the role
        await updateDoc(userRef, {
            role: newRole,
            updatedAt: serverTimestamp()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error assigning user role:', error);
        throw error;
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

// ============================================
// EVENT ORGANIZER FUNCTIONS
// ============================================

// Get all events created by an organizer
export const getEventsByOrganizer = async (organizerId) => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(
            eventsRef,
            where('organizerId', '==', organizerId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting organizer events:', error);
        throw error;
    }
};

// Get all registrations for an event with user details
export const getEventRegistrations = async (eventId) => {
    try {
        const regsRef = collection(db, 'events', eventId, 'registrations');
        const snapshot = await getDocs(regsRef);
        
        const registrations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            registrationTime: doc.data().registrationTime?.toDate?.() || new Date(doc.data().registrationTime)
        }));
        
        // Get payment info if any
        const paymentsRef = collection(db, 'events', eventId, 'payments');
        const paymentsSnap = await getDocs(paymentsRef);
        const paymentsMap = {};
        paymentsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.userId) {
                paymentsMap[data.userId] = {
                    paymentId: doc.id,
                    amount: data.amount,
                    status: data.status,
                    razorpayPaymentId: data.razorpayPaymentId,
                    createdAt: data.createdAt?.toDate?.() || null
                };
            }
        });
        
        // Merge payment info with registrations
        return registrations.map(reg => ({
            ...reg,
            payment: paymentsMap[reg.id] || null
        }));
    } catch (error) {
        console.error('Error getting event registrations:', error);
        throw error;
    }
};

// Update event details (for organizer)
export const updateEventDetails = async (eventId, updates, notifyUsers = false) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        const eventData = eventSnap.data();
        
        // Don't allow changing price if registrations exist
        if (updates.price !== undefined && updates.price !== eventData.price) {
            const regsRef = collection(db, 'events', eventId, 'registrations');
            const regsSnap = await getDocs(regsRef);
            if (regsSnap.size > 0) {
                throw new Error('Cannot change price after registrations exist');
            }
        }
        
        await updateDoc(eventRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        
        // Notify registered users if requested
        if (notifyUsers) {
            await notifyEventUpdate(eventId, eventData.title, `Event details have been updated`);
        }
        
        return true;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

// Cancel an event
export const cancelEvent = async (eventId, reason = '', refundPaid = false) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        const eventData = eventSnap.data();
        
        // Mark event as cancelled
        await updateDoc(eventRef, {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            cancellationReason: reason
        });
        
        // Notify all registered users
        await notifyEventCancelled(eventId, eventData.title, reason || 'The event has been cancelled by the organizer');
        
        // TODO: If refundPaid is true, process refunds for paid events
        // This would require Razorpay refund API integration
        
        return true;
    } catch (error) {
        console.error('Error cancelling event:', error);
        throw error;
    }
};

// Get organizer stats summary
export const getOrganizerStats = async (organizerId) => {
    try {
        const events = await getEventsByOrganizer(organizerId);
        
        let totalRegistrations = 0;
        let totalRevenue = 0;
        let upcomingEvents = 0;
        let pastEvents = 0;
        let cancelledEvents = 0;
        
        const now = new Date();
        
        for (const event of events) {
            totalRegistrations += event.registrationCount || 0;
            
            // Calculate revenue for paid events
            if (event.isPaid && event.registrationCount > 0) {
                totalRevenue += (event.price || 0) * (event.registrationCount || 0);
            }
            
            // Count by status
            if (event.status === 'cancelled') {
                cancelledEvents++;
            } else {
                const eventDate = event.date?.toDate?.() || new Date(event.date);
                if (eventDate > now) {
                    upcomingEvents++;
                } else {
                    pastEvents++;
                }
            }
        }
        
        return {
            totalEvents: events.length,
            totalRegistrations,
            totalRevenue: totalRevenue / 100, // Convert from paisa to rupees
            upcomingEvents,
            pastEvents,
            cancelledEvents
        };
    } catch (error) {
        console.error('Error getting organizer stats:', error);
        throw error;
    }
};

// ============================================
// CLUBS FUNCTIONS
// ============================================

// Club categories
export const CLUB_CATEGORIES = [
    { value: 'technical', label: 'Technical' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'sports', label: 'Sports' },
    { value: 'social', label: 'Social' },
    { value: 'literary', label: 'Literary' },
    { value: 'other', label: 'Other' },
];

// Upload club logo
export const uploadClubLogo = async (file, clubId) => {
    const filePath = `club-logos/${clubId}/${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
};

// Upload club banner
export const uploadClubBanner = async (file, clubId) => {
    const filePath = `club-banners/${clubId}/${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
};

// Create a new club
export const createClub = async (clubData, logoFile, bannerFile) => {
    const clubId = uuidv4();
    
    try {
        let logoURL = '';
        let bannerURL = '';
        
        if (logoFile) {
            logoURL = await uploadClubLogo(logoFile, clubId);
        }
        if (bannerFile) {
            bannerURL = await uploadClubBanner(bannerFile, clubId);
        }
        
        const finalClubData = {
            ...clubData,
            id: clubId,
            logoURL,
            bannerURL,
            memberCount: 0,
            status: 'active',
            createdAt: serverTimestamp(),
        };
        
        await setDoc(doc(db, 'clubs', clubId), finalClubData);
        
        // Add creator as first member (if they're faculty coordinator or leader)
        if (clubData.facultyCoordinatorId) {
            await setDoc(doc(db, 'clubs', clubId, 'members', clubData.facultyCoordinatorId), {
                userId: clubData.facultyCoordinatorId,
                displayName: clubData.facultyCoordinatorName,
                email: clubData.facultyCoordinatorEmail,
                role: 'coordinator',
                joinedAt: serverTimestamp(),
            });
        }
        
        if (clubData.leaderId) {
            await setDoc(doc(db, 'clubs', clubId, 'members', clubData.leaderId), {
                userId: clubData.leaderId,
                displayName: clubData.leaderName,
                email: clubData.leaderEmail,
                role: 'leader',
                joinedAt: serverTimestamp(),
            });
            
            // Add to leader's clubs
            await setDoc(doc(db, 'users', clubData.leaderId, 'clubs', clubId), {
                clubId,
                clubName: clubData.name,
                role: 'leader',
                joinedAt: serverTimestamp(),
            });
        }
        
        return clubId;
    } catch (error) {
        console.error('Error creating club:', error);
        throw error;
    }
};

// Update club details
export const updateClub = async (clubId, updates, logoFile, bannerFile) => {
    try {
        const updateData = { ...updates };
        
        if (logoFile) {
            updateData.logoURL = await uploadClubLogo(logoFile, clubId);
        }
        if (bannerFile) {
            updateData.bannerURL = await uploadClubBanner(bannerFile, clubId);
        }
        
        await updateDoc(doc(db, 'clubs', clubId), updateData);
    } catch (error) {
        console.error('Error updating club:', error);
        throw error;
    }
};

// Get all clubs for a college
export const getClubsByCollege = async (collegeId, filters = {}) => {
    try {
        const clubsRef = collection(db, 'clubs');
        const constraints = [
            where('collegeId', '==', collegeId),
            where('status', '==', 'active'),
        ];
        
        if (filters.category && filters.category !== 'all') {
            constraints.push(where('category', '==', filters.category));
        }
        
        // Only use Firestore filter for paid (isPaid == true)
        // Free filter is done client-side since documents without isPaid field won't match
        if (filters.priceFilter === 'paid') {
            constraints.push(where('isPaid', '==', true));
        }
        
        constraints.push(orderBy('memberCount', 'desc'));
        
        const q = query(clubsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        let clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Client-side filter for free (to include clubs without isPaid field)
        if (filters.priceFilter === 'free') {
            clubs = clubs.filter(c => !c.isPaid);
        }
        
        return clubs;
    } catch (error) {
        console.error('Error getting clubs:', error);
        throw error;
    }
};

// Get single club by ID
export const getClubById = async (clubId) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        
        if (!clubSnap.exists()) {
            return null;
        }
        
        return { id: clubSnap.id, ...clubSnap.data() };
    } catch (error) {
        console.error('Error getting club:', error);
        throw error;
    }
};

// Join a free club
export const joinClub = async (clubId, userId, userName, userEmail, userPhoto) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        
        if (!clubSnap.exists()) {
            throw new Error('Club not found');
        }
        
        const club = clubSnap.data();
        
        if (club.isPaid) {
            throw new Error('This is a paid club. Use joinPaidClub instead.');
        }
        
        // Check if club requires approval
        if (club.requiresApproval) {
            // Check if already has pending request
            const hasPending = await checkPendingJoinRequest(clubId, userId);
            if (hasPending) {
                throw new Error('You already have a pending join request for this club.');
            }
            
            // Create join request instead of directly joining
            await requestToJoinClub(clubId, userId, {
                name: userName,
                displayName: userName,
                email: userEmail,
                photoURL: userPhoto
            });
            
            return { requiresApproval: true };
        }
        
        const batch = writeBatch(db);
        
        // Add to club members
        batch.set(doc(db, 'clubs', clubId, 'members', userId), {
            userId,
            displayName: userName,
            email: userEmail,
            photoURL: userPhoto || '',
            role: 'member',
            joinedAt: serverTimestamp(),
        });
        
        // Add to user's clubs
        batch.set(doc(db, 'users', userId, 'clubs', clubId), {
            clubId,
            clubName: club.name,
            role: 'member',
            joinedAt: serverTimestamp(),
        });
        
        // Increment member count
        batch.update(clubRef, { memberCount: increment(1) });
        
        await batch.commit();
        
        // Log activity
        await logActivity(userId, {
            type: 'join_club',
            clubId,
            clubName: club.name,
            message: `Joined ${club.name}`,
        });
        
        return { requiresApproval: false };
        
    } catch (error) {
        console.error('Error joining club:', error);
        throw error;
    }
};

// Create payment order for paid club
export const createClubPaymentOrder = async (clubId, userId, userEmail, userName) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        
        if (!clubSnap.exists()) {
            throw new Error('Club not found');
        }
        
        const club = clubSnap.data();
        
        if (!club.isPaid) {
            throw new Error('This is a free club');
        }
        
        // Check if already a member
        const memberRef = doc(db, 'clubs', clubId, 'members', userId);
        const memberSnap = await getDoc(memberRef);
        
        if (memberSnap.exists()) {
            throw new Error('Already a member of this club');
        }
        
        const paymentId = uuidv4();
        const paymentData = {
            id: paymentId,
            clubId,
            clubName: club.name,
            userId,
            userEmail,
            userName,
            amount: club.membershipFee,
            status: 'pending',
            createdAt: serverTimestamp(),
        };
        
        // Store in club's payments and user's payments
        const batch = writeBatch(db);
        batch.set(doc(db, 'clubs', clubId, 'payments', paymentId), paymentData);
        batch.set(doc(db, 'users', userId, 'payments', paymentId), {
            ...paymentData,
            type: 'club_membership',
        });
        await batch.commit();
        
        return {
            paymentId,
            amount: club.membershipFee,
            clubName: club.name,
            clubId,
            currency: 'INR',
            prefill: { email: userEmail, name: userName },
        };
    } catch (error) {
        console.error('Error creating club payment order:', error);
        throw error;
    }
};

// Verify club membership payment and add member
export const verifyClubPayment = async (paymentId, clubId, userId, razorpayPaymentId, razorpayOrderId, razorpaySignature) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        
        if (!clubSnap.exists()) {
            throw new Error('Club not found');
        }
        
        const club = clubSnap.data();
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        const batch = writeBatch(db);
        
        // Update payment status
        const paymentUpdate = {
            status: 'success',
            razorpayPaymentId,
            razorpayOrderId: razorpayOrderId || null,
            razorpaySignature: razorpaySignature || null,
            completedAt: serverTimestamp(),
        };
        
        batch.update(doc(db, 'clubs', clubId, 'payments', paymentId), paymentUpdate);
        batch.update(doc(db, 'users', userId, 'payments', paymentId), paymentUpdate);
        
        // Add to club members
        batch.set(doc(db, 'clubs', clubId, 'members', userId), {
            userId,
            displayName: userData.displayName || 'Anonymous',
            email: userData.email,
            photoURL: userData.photoURL || '',
            role: 'member',
            joinedAt: serverTimestamp(),
            paymentId,
            paidAmount: club.membershipFee,
        });
        
        // Add to user's clubs
        batch.set(doc(db, 'users', userId, 'clubs', clubId), {
            clubId,
            clubName: club.name,
            role: 'member',
            joinedAt: serverTimestamp(),
            paymentId,
        });
        
        // Increment member count
        batch.update(clubRef, { memberCount: increment(1) });
        
        await batch.commit();
        
        // Log activity
        await logActivity(userId, {
            type: 'join_club',
            clubId,
            clubName: club.name,
            amount: club.membershipFee,
            message: `Paid ₹${club.membershipFee / 100} and joined ${club.name}`,
        });
        
        // Send notification
        await createNotification(userId, {
            type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
            title: 'Club Membership Confirmed',
            message: `You are now a member of ${club.name}`,
            clubId,
            clubName: club.name,
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error verifying club payment:', error);
        throw error;
    }
};

// Leave a club
export const leaveClub = async (clubId, userId) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        
        if (!clubSnap.exists()) {
            throw new Error('Club not found');
        }
        
        const club = clubSnap.data();
        
        // Can't leave if you're the leader or coordinator
        if (club.leaderId === userId || club.facultyCoordinatorId === userId) {
            throw new Error('Leaders and coordinators cannot leave. Transfer leadership first.');
        }
        
        const batch = writeBatch(db);
        
        // Remove from club members
        batch.delete(doc(db, 'clubs', clubId, 'members', userId));
        
        // Remove from user's clubs
        batch.delete(doc(db, 'users', userId, 'clubs', clubId));
        
        // Decrement member count
        batch.update(clubRef, { memberCount: increment(-1) });
        
        await batch.commit();
        
        // Log activity
        await logActivity(userId, {
            type: 'leave_club',
            clubId,
            clubName: club.name,
            message: `Left ${club.name}`,
        });
        
    } catch (error) {
        console.error('Error leaving club:', error);
        throw error;
    }
};

// Remove a member from club (coordinator action)
export const removeClubMember = async (clubId, memberId, removedByName) => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        
        if (!clubSnap.exists()) {
            throw new Error('Club not found');
        }
        
        const club = clubSnap.data();
        
        // Can't remove leader or coordinator
        if (club.leaderId === memberId || club.facultyCoordinatorId === memberId) {
            throw new Error('Cannot remove leaders or coordinators');
        }
        
        const batch = writeBatch(db);
        
        // Remove from club members
        batch.delete(doc(db, 'clubs', clubId, 'members', memberId));
        
        // Remove from user's clubs
        batch.delete(doc(db, 'users', memberId, 'clubs', clubId));
        
        // Decrement member count
        batch.update(clubRef, { memberCount: increment(-1) });
        
        await batch.commit();
        
        // Notify the removed member
        await createNotification(memberId, {
            type: 'club_removed',
            title: 'Removed from Club',
            message: `You have been removed from ${club.name} by ${removedByName}.`,
            clubId,
            clubName: club.name,
            link: `/clubs`
        });
        
    } catch (error) {
        console.error('Error removing club member:', error);
        throw error;
    }
};

// Get club members
export const getClubMembers = async (clubId, lastDoc = null, pageSize = 20) => {
    try {
        const membersRef = collection(db, 'clubs', clubId, 'members');
        const constraints = [orderBy('joinedAt', 'desc'), limit(pageSize)];
        
        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }
        
        const q = query(membersRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
        
        return { members, lastVisible, hasMore: snapshot.docs.length === pageSize };
    } catch (error) {
        console.error('Error getting club members:', error);
        throw error;
    }
};

// Get user's clubs
export const getUserClubs = async (userId) => {
    try {
        const userClubsRef = collection(db, 'users', userId, 'clubs');
        const snapshot = await getDocs(userClubsRef);
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting user clubs:', error);
        throw error;
    }
};

// Check if user is member of a club
export const checkClubMembership = async (clubId, userId) => {
    try {
        const memberRef = doc(db, 'clubs', clubId, 'members', userId);
        const memberSnap = await getDoc(memberRef);
        
        if (!memberSnap.exists()) {
            return null;
        }
        
        return memberSnap.data();
    } catch (error) {
        console.error('Error checking club membership:', error);
        return null;
    }
};

// Real-time listener for user's club memberships
export const onUserClubsChange = (userId, callback) => {
    const userClubsRef = collection(db, 'users', userId, 'clubs');
    
    return onSnapshot(userClubsRef, (snapshot) => {
        const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(clubs);
    });
};

// Search clubs by name
export const searchClubs = async (searchTerm, collegeId) => {
    try {
        // Get all clubs for the college and filter client-side
        const clubsRef = collection(db, 'clubs');
        const q = query(
            clubsRef,
            where('collegeId', '==', collegeId),
            where('status', '==', 'active')
        );
        
        const snapshot = await getDocs(q);
        const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Client-side search
        const searchLower = searchTerm.toLowerCase();
        return clubs.filter(club => 
            club.name.toLowerCase().includes(searchLower) ||
            club.description?.toLowerCase().includes(searchLower) ||
            club.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
    } catch (error) {
        console.error('Error searching clubs:', error);
        throw error;
    }
};

// Get events by club
export const getClubEvents = async (clubId) => {
    try {
        const eventsRef = collection(db, 'events');
        const todayString = new Date().toISOString().split('T')[0];
        
        const q = query(
            eventsRef,
            where('clubId', '==', clubId),
            where('status', '==', 'approved'),
            where('date', '>=', todayString),
            orderBy('date', 'asc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting club events:', error);
        throw error;
    }
};

// Format membership fee
export const formatMembershipFee = (paisa) => {
    if (!paisa || paisa === 0) return 'Free';
    return `₹${paisa / 100}`;
};

// ============================================
// FACULTY DASHBOARD FUNCTIONS
// ============================================

// Request to join a club (for approval-required clubs)
export const requestToJoinClub = async (clubId, userId, userData) => {
    try {
        const requestRef = doc(db, 'clubs', clubId, 'joinRequests', uuidv4());
        
        await setDoc(requestRef, {
            userId,
            userName: userData.name || userData.displayName || 'Unknown',
            userEmail: userData.email,
            userPhotoURL: userData.photoURL || null,
            status: 'pending',
            requestedAt: serverTimestamp(),
            processedAt: null,
            processedBy: null
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error requesting to join club:', error);
        throw error;
    }
};

// Check if user has a pending join request for a club
export const checkPendingJoinRequest = async (clubId, userId) => {
    try {
        const requestsRef = collection(db, 'clubs', clubId, 'joinRequests');
        const q = query(
            requestsRef,
            where('userId', '==', userId),
            where('status', '==', 'pending')
        );
        
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking pending request:', error);
        return false;
    }
};

// Get pending join requests for a club
export const getPendingJoinRequests = async (clubId) => {
    try {
        const requestsRef = collection(db, 'clubs', clubId, 'joinRequests');
        const q = query(
            requestsRef,
            where('status', '==', 'pending'),
            orderBy('requestedAt', 'asc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, clubId, ...doc.data() }));
    } catch (error) {
        console.error('Error getting pending requests:', error);
        throw error;
    }
};

// Approve join request
export const approveJoinRequest = async (clubId, requestId, approverUserId) => {
    try {
        // Get the request first
        const requestRef = doc(db, 'clubs', clubId, 'joinRequests', requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
            throw new Error('Join request not found');
        }
        
        const requestData = requestSnap.data();
        const userId = requestData.userId;
        
        // Get club data
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        const clubData = clubSnap.data();
        
        // Start batch write
        const batch = writeBatch(db);
        
        // Update request status
        batch.update(requestRef, {
            status: 'approved',
            processedAt: serverTimestamp(),
            processedBy: approverUserId
        });
        
        // Add user to club members
        const memberRef = doc(db, 'clubs', clubId, 'members', userId);
        batch.set(memberRef, {
            userId,
            userName: requestData.userName,
            userEmail: requestData.userEmail,
            userPhotoURL: requestData.userPhotoURL,
            role: 'member',
            joinedAt: serverTimestamp()
        });
        
        // Add club to user's clubs
        const userClubRef = doc(db, 'users', userId, 'clubs', clubId);
        batch.set(userClubRef, {
            clubId,
            clubName: clubData.name,
            clubLogoURL: clubData.logoURL || null,
            role: 'member',
            joinedAt: serverTimestamp()
        });
        
        // Increment member count
        batch.update(clubRef, {
            memberCount: increment(1)
        });
        
        await batch.commit();
        
        // Create notification for the user
        await createNotification(userId, {
            type: 'club_approved',
            title: 'Club Join Request Approved!',
            message: `Your request to join "${clubData.name}" has been approved. Welcome to the club!`,
            clubId,
            clubName: clubData.name
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error approving join request:', error);
        throw error;
    }
};

// Reject join request
export const rejectJoinRequest = async (clubId, requestId, approverUserId, reason = '') => {
    try {
        // Get the request first
        const requestRef = doc(db, 'clubs', clubId, 'joinRequests', requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
            throw new Error('Join request not found');
        }
        
        const requestData = requestSnap.data();
        const userId = requestData.userId;
        
        // Get club data
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);
        const clubData = clubSnap.data();
        
        // Update request status
        await updateDoc(requestRef, {
            status: 'rejected',
            processedAt: serverTimestamp(),
            processedBy: approverUserId,
            rejectionReason: reason
        });
        
        // Create notification for the user
        await createNotification(userId, {
            type: 'club_rejected',
            title: 'Club Join Request Declined',
            message: `Your request to join "${clubData.name}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
            clubId,
            clubName: clubData.name
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error rejecting join request:', error);
        throw error;
    }
};

// Get all clubs where user is faculty coordinator
export const getFacultyClubs = async (facultyUserId) => {
    try {
        const clubsRef = collection(db, 'clubs');
        const q = query(
            clubsRef,
            where('facultyCoordinatorId', '==', facultyUserId),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting faculty clubs:', error);
        throw error;
    }
};

// Get all pending join requests for faculty's clubs
export const getAllPendingRequestsForFaculty = async (facultyUserId) => {
    try {
        // First get all clubs where user is coordinator
        const clubs = await getFacultyClubs(facultyUserId);
        
        // Get pending requests for each club
        const allRequests = [];
        for (const club of clubs) {
            const requests = await getPendingJoinRequests(club.id);
            // Add club info to each request
            requests.forEach(req => {
                allRequests.push({
                    ...req,
                    clubName: club.name,
                    clubLogoURL: club.logoURL
                });
            });
        }
        
        // Sort by request date
        allRequests.sort((a, b) => {
            const dateA = a.requestedAt?.toDate?.() || new Date(0);
            const dateB = b.requestedAt?.toDate?.() || new Date(0);
            return dateA - dateB;
        });
        
        return allRequests;
    } catch (error) {
        console.error('Error getting all pending requests:', error);
        throw error;
    }
};

// Get faculty dashboard stats
export const getFacultyStats = async (facultyUserId) => {
    try {
        // Get faculty's clubs
        const clubs = await getFacultyClubs(facultyUserId);
        
        let totalMembers = 0;
        let pendingRequests = 0;
        let totalRevenue = 0;
        
        for (const club of clubs) {
            totalMembers += club.memberCount || 0;
            
            // Get pending requests count
            const requests = await getPendingJoinRequests(club.id);
            pendingRequests += requests.length;
            
            // Get club payments for revenue (only paid clubs)
            if (club.isPaid) {
                const paymentsRef = collection(db, 'clubs', club.id, 'payments');
                const paymentsQ = query(paymentsRef, where('status', '==', 'completed'));
                const paymentsSnap = await getDocs(paymentsQ);
                paymentsSnap.forEach(doc => {
                    totalRevenue += doc.data().amount || 0;
                });
            }
        }
        
        // Get events created by faculty
        const eventsRef = collection(db, 'events');
        const eventsQ = query(eventsRef, where('organizerId', '==', facultyUserId));
        const eventsSnap = await getDocs(eventsQ);
        const totalEvents = eventsSnap.size;
        
        // Calculate event revenue
        let eventRevenue = 0;
        for (const eventDoc of eventsSnap.docs) {
            const eventData = eventDoc.data();
            if (eventData.isPaid) {
                const eventPaymentsRef = collection(db, 'events', eventDoc.id, 'payments');
                const eventPaymentsQ = query(eventPaymentsRef, where('status', '==', 'completed'));
                const eventPaymentsSnap = await getDocs(eventPaymentsQ);
                eventPaymentsSnap.forEach(doc => {
                    eventRevenue += doc.data().amount || 0;
                });
            }
        }
        
        return {
            totalClubs: clubs.length,
            totalMembers,
            pendingRequests,
            totalEvents,
            clubRevenue: totalRevenue,
            eventRevenue,
            totalRevenue: totalRevenue + eventRevenue
        };
    } catch (error) {
        console.error('Error getting faculty stats:', error);
        throw error;
    }
};

// Get faculty's events
export const getFacultyEvents = async (facultyUserId, filter = 'all') => {
    try {
        const eventsRef = collection(db, 'events');
        let q;
        
        if (filter === 'upcoming') {
            const todayString = new Date().toISOString().split('T')[0];
            q = query(
                eventsRef,
                where('organizerId', '==', facultyUserId),
                where('date', '>=', todayString),
                orderBy('date', 'asc')
            );
        } else if (filter === 'past') {
            const todayString = new Date().toISOString().split('T')[0];
            q = query(
                eventsRef,
                where('organizerId', '==', facultyUserId),
                where('date', '<', todayString),
                orderBy('date', 'desc')
            );
        } else {
            q = query(
                eventsRef,
                where('organizerId', '==', facultyUserId),
                orderBy('createdAt', 'desc')
            );
        }
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting faculty events:', error);
        throw error;
    }
};

// Get club payment history for faculty
export const getClubPaymentHistory = async (clubId) => {
    try {
        const paymentsRef = collection(db, 'clubs', clubId, 'payments');
        const q = query(paymentsRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting club payment history:', error);
        throw error;
    }
};