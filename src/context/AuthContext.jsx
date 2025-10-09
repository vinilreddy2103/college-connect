import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [collegeSettings, setCollegeSettings] = useState({ festMode: false }); // Add state for college settings
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const fetchedUserData = userDocSnap.data();
                    setUserData(fetchedUserData);

                    // If user has a collegeId, listen for changes to college settings
                    if (fetchedUserData.collegeId) {
                        const collegeRef = doc(db, 'colleges', fetchedUserData.collegeId);
                        const unsubscribeCollege = onSnapshot(collegeRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setCollegeSettings(docSnap.data());
                            }
                        });
                        // We'll need to manage this unsubscribe later if the user logs out
                    }
                }
            } else {
                setUserData(null);
                setCollegeSettings({ festMode: false });
            }
            setLoading(false);
        });

        return unsubscribeAuth;
    }, []);

    const value = {
        currentUser,
        userData,
        collegeSettings, // Provide settings to the rest of the app
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}