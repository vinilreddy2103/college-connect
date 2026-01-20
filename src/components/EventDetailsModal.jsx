import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerForEvent, unregisterFromEvent } from '../firebase';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import Modal from './Modal'; // Assuming you have this generic Modal component

function EventDetailsModal({ isOpen, onClose, event }) {
    const { currentUser, userData, registeredEvents } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLocallyRegistered, setIsLocallyRegistered] = useState(false);

    // Sync registration status when the event changes or opens
    useEffect(() => {
        if (event && registeredEvents) {
            setIsLocallyRegistered(registeredEvents.has(event.id));
        }
    }, [event, registeredEvents]);

    const handleRegistration = async () => {
        if (!event) return;
        setIsRegistering(true);
        const wasRegistered = isLocallyRegistered;
        
        // Optimistic UI update
        setIsLocallyRegistered(!wasRegistered);

        try {
            if (wasRegistered) {
                await unregisterFromEvent(event.id, currentUser.uid);
                toast.success("Unregistered successfully.");
            } else {
                await registerForEvent(event.id, currentUser.uid, userData.displayName);
                toast.success("Registered successfully!");
            }
        } catch (error) {
            setIsLocallyRegistered(wasRegistered); // Revert on failure
            toast.error("Action failed. Please try again.");
            console.error(error);
        }
        setIsRegistering(false);
    };

    if (!event) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={event.title}>
            <div className="space-y-6">
                <img 
                    src={event.posterURL || 'https://via.placeholder.com/400x200.png?text=Event+Poster'} 
                    alt={event.title} 
                    className="w-full h-64 object-cover rounded-lg"
                />
                
                <div>
                    <h3 className="text-gray-300 font-semibold mb-2">Description</h3>
                    <p className="text-gray-400">{event.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300">
                    <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                        <FaCalendarAlt className="mr-3 text-sky-400" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
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

                <div className="flex justify-end pt-4 border-t border-slate-700">
                    <button
                        onClick={handleRegistration}
                        disabled={isRegistering}
                        className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
                            isLocallyRegistered
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {isLocallyRegistered ? (
                            <><FaUserCheck className="inline mr-2"/> Unregister</>
                        ) : (
                            <><FaUserPlus className="inline mr-2"/> Register</>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default EventDetailsModal;