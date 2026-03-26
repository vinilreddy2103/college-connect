import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
// Import the new function for listening to registrations and notifications
import { auth, db, onUserRegistrationsChange, subscribeToNotifications } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [collegeSettings, setCollegeSettings] = useState({ festMode: false });
    // --- State to track registered events ---
    const [registeredEvents, setRegisteredEvents] = useState(new Set());
    // --- Notification state ---
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Placeholder for listener cleanup functions
        let unsubscribeRegistrations = () => { };
        let unsubscribeCollege = () => { };
        let unsubscribeNotifications = () => { };

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Clean up any previous user's listeners
                unsubscribeRegistrations();
                unsubscribeCollege();
                unsubscribeNotifications();

                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const fetchedUserData = userDocSnap.data();
                    setUserData(fetchedUserData);

                    // Set up a listener for the current user's registrations
                    unsubscribeRegistrations = onUserRegistrationsChange(user.uid, (eventIds) => {
                        setRegisteredEvents(eventIds);
                    });

                    // Set up a listener for notifications
                    unsubscribeNotifications = subscribeToNotifications(user.uid, (notifs) => {
                        setNotifications(notifs);
                        setUnreadNotificationCount(notifs.filter(n => !n.read).length);
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
                // Clear registrations and notifications, clean up listeners on logout
                setRegisteredEvents(new Set());
                setNotifications([]);
                setUnreadNotificationCount(0);
                unsubscribeRegistrations();
                unsubscribeCollege();
                unsubscribeNotifications();
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            // Ensure all listeners are cleaned up on component unmount
            unsubscribeRegistrations();
            unsubscribeCollege();
            unsubscribeNotifications();
        };
    }, []);

    const value = {
        currentUser,
        userData,
        collegeSettings,
        registeredEvents,
        notifications,
        unreadNotificationCount,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}