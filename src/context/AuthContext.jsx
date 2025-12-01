import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
// Import the new function for listening to registrations
import { auth, db, onUserRegistrationsChange } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [collegeSettings, setCollegeSettings] = useState({ festMode: false });
    // --- NEW: State to track registered events ---
    const [registeredEvents, setRegisteredEvents] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- NEW: Placeholder for the registration listener cleanup function ---
        let unsubscribeRegistrations = () => { };
        let unsubscribeCollege = () => { };

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // --- NEW: Clean up any previous user's registration listener ---
                unsubscribeRegistrations();
                unsubscribeCollege();

                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const fetchedUserData = userDocSnap.data();
                    setUserData(fetchedUserData);

                    // --- NEW: Set up a listener for the current user's registrations ---
                    unsubscribeRegistrations = onUserRegistrationsChange(user.uid, (eventIds) => {
                        setRegisteredEvents(eventIds);
                    });

                    if (fetchedUserData.collegeId) {
                        const collegeRef = doc(db, 'colleges', fetchedUserData.collegeId);
                        unsubscribeCollege = onSnapshot(collegeRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setCollegeSettings(docSnap.data());
                            }
                        });
                    }
                }
            } else {
                setUserData(null);
                setCollegeSettings({ festMode: false });
                // --- NEW: Clear registrations and clean up listeners on logout ---
                setRegisteredEvents(new Set());
                unsubscribeRegistrations();
                unsubscribeCollege();
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            // --- NEW: Ensure all listeners are cleaned up on component unmount ---
            unsubscribeRegistrations();
            unsubscribeCollege();
        };
    }, []);

    const value = {
        currentUser,
        userData,
        collegeSettings,
        registeredEvents, // --- NEW: Provide registered events to the app ---
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}