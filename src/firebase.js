import { initializeApp } from "firebase/app";
// Import only the functions you need from the auth SDK
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
// Import all necessary Firestore functions
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
} from "firebase/firestore";
// getStorage is removed as it's not used in this file

// Your web app's Firebase configuration, using environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// You can initialize storage here if you plan to use it later,
// but it's not required by the current functions.
// export const storage = getStorage(app); 

// Create a new instance of the Google provider
const googleProvider = new GoogleAuthProvider();

/**
 * Signs in the user with a Google account and dynamically verifies their email domain
 * by checking against a 'colleges' collection in Firestore.
 */
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
            console.log("New user document created in Firestore.");
        }

        console.log(`Successfully signed in for ${collegeData.name}:`, user);
        return user;

    } catch (error) {
        console.error("Error during Google sign-in:", error);
        alert(error.message);
        return null;
    }
};

/**
 * Signs out the current user.
 */
export const logout = async () => {
    try {
        await signOut(auth);
        console.log("User signed out successfully.");
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

// --- ADMIN FUNCTIONS ---

/**
 * Adds a new college document to the 'colleges' collection.
 */
export const addCollege = async (name, domain) => {
    const collegesRef = collection(db, "colleges");
    await addDoc(collegesRef, {
        name: name,
        domain: domain,
        createdAt: new Date(),
    });
};

/**
 * Sets up a real-time listener for the 'colleges' collection.
 * @param {function} callback - The function to call with the updated list of colleges.
 * @returns {function} - An unsubscribe function to detach the listener.
 */
export const onCollegesUpdate = (callback) => {
    const collegesRef = collection(db, "colleges");
    const unsubscribe = onSnapshot(collegesRef, (snapshot) => {
        const collegesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(collegesList);
    });
    return unsubscribe;
};


/**
 * Creates a new user with email and password and verifies their domain.
 */
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

/**
 * Signs in an existing user with email and password.
 */
export const signInWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error during email sign-in:", error);
        // Re-throw the error so the component can catch it and display it
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
    // Update the profile in Firebase Authentication
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, data);
    }

    // Update the user document in Firestore
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data);
};
export const uploadProfileImage = async (file, userId) => {
    const storage = getStorage();
    // Create a reference to the file location
    const fileRef = ref(storage, `profile-pictures/${userId}`);

    // Upload the file
    await uploadBytes(fileRef, file);

    // Get the public download URL
    const photoURL = await getDownloadURL(fileRef);

    return photoURL;
};