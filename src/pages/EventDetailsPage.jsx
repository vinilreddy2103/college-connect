import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, registerForEvent, unregisterFromEvent } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUserPlus, FaUserCheck } from 'react-icons/fa';

function EventDetailsPage() {
    const { eventId } = useParams();
    const { currentUser, userData, registeredEvents } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);

    // --- NEW: Local state for immediate UI feedback ---
    const [isLocallyRegistered, setIsLocallyRegistered] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            try {
                const eventDocRef = doc(db, 'events', eventId);
                const eventDocSnap = await getDoc(eventDocRef);
                if (eventDocSnap.exists()) {
                    setEvent({ id: eventDocSnap.id, ...eventDocSnap.data() });
                } else {
                    toast.error("Event not found.");
                }
            } catch (error) {
                toast.error("Failed to load event details.");
                console.error(error);
            }
            setLoading(false);
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    // --- NEW: Sync local state with the context when it changes ---
    useEffect(() => {
        setIsLocallyRegistered(registeredEvents.has(eventId));
    }, [registeredEvents, eventId]);


    const handleRegistration = async () => {
        setIsRegistering(true);

        // --- NEW: Optimistically update the local state immediately ---
        const wasRegistered = isLocallyRegistered;
        setIsLocallyRegistered(!wasRegistered);

        try {
            if (wasRegistered) {
                await unregisterFromEvent(eventId, currentUser.uid);
                toast.success("Successfully unregistered from the event.");
            } else {
                await registerForEvent(eventId, currentUser.uid, userData.displayName);
                toast.success("Successfully registered for the event!");
            }
        } catch (error) {
            // --- NEW: If the database call fails, revert the local state ---
            setIsLocallyRegistered(wasRegistered);
            toast.error("An error occurred. Please try again.");
            console.error("Registration error:", error);
        }
        setIsRegistering(false);
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading event...</div>;
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-red-500">Event Not Found</h2>
                <Link to="/dashboard" className="mt-4 px-4 py-2 bg-sky-600 rounded-lg hover:bg-sky-700">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard" className="inline-flex items-center text-sky-400 hover:text-sky-300 mb-6">
                    <FaArrowLeft className="mr-2" />
                    Back to Dashboard
                </Link>

                <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <img src={event.posterURL} alt={`${event.title} Poster`} className="w-full h-64 object-cover" />
                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                        <p className="text-sm text-gray-400 mb-4">Organized by: {event.organizerName}</p>

                        <p className="text-gray-300 mb-6">{event.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-sm">
                            <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                                <FaCalendarAlt className="mr-3 text-sky-400" />
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                                <FaClock className="mr-3 text-sky-400" />
                                <span>{event.time}</span>
                            </div>
                            <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                                <FaMapMarkerAlt className="mr-3 text-sky-400" />
                                <span>{event.venue}</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleRegistration}
                                disabled={isRegistering}
                                className={`w-full sm:w-auto px-8 py-3 text-lg font-semibold rounded-lg transition-colors duration-300 disabled:opacity-50 flex items-center justify-center mx-auto ${
                                    // --- CHANGED: Use local state for the button's appearance ---
                                    isLocallyRegistered
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                            >
                                {isLocallyRegistered ? (
                                    <>
                                        <FaUserCheck className="mr-2" />
                                        Unregister
                                    </>
                                ) : (
                                    <>
                                        <FaUserPlus className="mr-2" />
                                        Register for Event
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventDetailsPage;