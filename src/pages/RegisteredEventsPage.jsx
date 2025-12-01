import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEventsByIds } from '../firebase'; // Import the new, efficient function
import EventCard from '../components/EventCard';
import DashboardHeader from '../components/DashboardHeader';
import { toast } from 'react-toastify';

function RegisteredEventsPage() {
    const { registeredEvents } = useAuth();
    const [userRegisteredEvents, setUserRegisteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegisteredEvents = async () => {
            setLoading(true);
            // Convert the Set of IDs from the context into an array
            const eventIds = Array.from(registeredEvents);

            if (eventIds.length > 0) {
                try {
                    // Fetch only the specific events the user is registered for
                    const events = await getEventsByIds(eventIds);
                    setUserRegisteredEvents(events);
                } catch (error) {
                    toast.error("Could not load your registered events.");
                    console.error("Failed to fetch registered events:", error);
                }
            }
            setLoading(false);
        };

        // Only run the fetch if the registration data is available
        if (registeredEvents.size > 0) {
            fetchRegisteredEvents();
        } else {
            setLoading(false); // If there are no registered events, stop loading
        }

    }, [registeredEvents]); // This effect will re-run whenever the user's registrations change

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <DashboardHeader />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-sky-400 mb-6">My Registered Events</h1>
                    {loading ? (
                        <p>Loading your events...</p>
                    ) : userRegisteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userRegisteredEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-800 rounded-lg">
                            <p className="text-gray-400">You haven't registered for any events yet.</p>
                            <Link to="/dashboard" className="mt-4 inline-block px-4 py-2 bg-sky-600 rounded-lg hover:bg-sky-700">
                                Discover Events
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default RegisteredEventsPage;