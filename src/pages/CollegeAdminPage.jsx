import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

function CollegeAdminPage() {
    const { userData } = useAuth();
    const [isFestMode, setIsFestMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Set up a real-time listener for the college's settings
    useEffect(() => {
        if (!userData?.collegeId) return;

        const collegeRef = doc(db, 'colleges', userData.collegeId);
        const unsubscribe = onSnapshot(collegeRef, (docSnap) => {
            if (docSnap.exists()) {
                const collegeData = docSnap.data();
                setIsFestMode(collegeData.festMode || false);
            }
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [userData?.collegeId]);

    const handleToggleFestMode = async () => {
        if (!userData?.collegeId) return;
        const collegeRef = doc(db, 'colleges', userData.collegeId);
        try {
            await updateDoc(collegeRef, {
                festMode: !isFestMode
            });
            toast.success(`Fest Mode ${!isFestMode ? 'activated' : 'deactivated'}!`);
        } catch (error) {
            toast.error("Failed to update setting. Please try again.");
            console.error("Error toggling Fest Mode:", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-900 text-white text-center p-8">Loading settings...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">College Admin Portal</h1>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Settings for {userData.collegeName}</h2>
                    <div className="flex items-center justify-between bg-slate-700 p-4 rounded-md">
                        <div>
                            <h3 className="font-medium">Fest Mode</h3>
                            <p className="text-sm text-gray-400">
                                Allow students to create events during your college's festival period.
                            </p>
                        </div>
                        <button
                            onClick={handleToggleFestMode}
                            className={`px-4 py-2 rounded-lg font-semibold ${isFestMode ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            {isFestMode ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CollegeAdminPage;