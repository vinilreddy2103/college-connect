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
    orderBy, // This was missing from the consolidated import list
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

// --- Your firebaseConfig remains the same ---
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

const googleProvider = new GoogleAuthProvider();

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
            await setDoc(userDocRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: "student",
                collegeId: collegeId,
                collegeName: collegeData.name,
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

export const addCollege = async (name, domain) => {
    const collegesRef = collection(db, "colleges");
    await addDoc(collegesRef, {
        name: name,
        domain: domain,
        festMode: false,
        createdAt: new Date(),
    });
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
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: email.split('@')[0],
            email: user.email,
            photoURL: '',
            role: "student",
            collegeId: collegeId,
            collegeName: collegeData.name,
            createdAt: new Date()
        });
        return user;
    } catch (error) {
        console.error("Error during email sign-up:", error);
        throw error;
    }
};

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
    if (!collegeId) {
        return [];
    }
    try {
        // Get a reference to the Cloud Function
        const getUpcomingEventsFunction = httpsCallable(functions, 'getUpcomingEvents');

        // Call the function with the collegeId
        const result = await getUpcomingEventsFunction({ collegeId: collegeId });

        // The events are in the 'data' property of the result
        return result.data;

    } catch (error) {
        console.error("Error fetching approved events via Cloud Function:", error);
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