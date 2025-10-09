import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import Modal from '../components/Modal';
import CreateEventForm from '../components/CreateEventForm';
import EventCard from '../components/EventCard';
import { getApprovedEventsByCollege, getPendingEventsByCollege, updateEventStatus } from '../firebase';
import { toast } from 'react-toastify'; // This line was missing

// --- StudentDashboard ---
const StudentDashboard = ({ userData }) => {
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            if (userData?.collegeId) {
                try {
                    const fetchedEvents = await getApprovedEventsByCollege(userData.collegeId);
                    setEvents(fetchedEvents);
                } catch (error) {
                    console.error("Failed to load events for dashboard", error);
                }
                setLoadingEvents(false);
            }
        };

        fetchEvents();
    }, [userData?.collegeId]);

    return (
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-sky-400">Upcoming Events at {userData.collegeName}</h2>
            <p className="mt-2 text-gray-400">Discover what's happening on campus.</p>

            {loadingEvents ? (
                <p className="mt-4 text-center">Loading events...</p>
            ) : events.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <p className="mt-6 text-center text-gray-500">No upcoming events have been approved yet. Check back soon!</p>
            )}
        </div>
    );
};

// --- ClubLeadDashboard ---
const ClubLeadDashboard = ({ userData, onOpenCreateEvent }) => (
    <div className="bg-slate-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-sky-400">Club Lead Dashboard</h2>
        <p className="mt-4 text-gray-300">Welcome, {userData.displayName}! Manage your club's events here.</p>
        <button onClick={onOpenCreateEvent} className="mt-4 px-4 py-2 bg-sky-600 rounded-lg hover:bg-sky-700">
            + New Event
        </button>
    </div>
);

// --- AdminDashboard ---
const AdminDashboard = ({ userData }) => {
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingEvents = async () => {
        try {
            const events = await getPendingEventsByCollege(userData.collegeId);
            setPendingEvents(events);
        } catch (error) {
            toast.error("Could not fetch pending events.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPendingEvents();
    }, [userData.collegeId]);

    const handleEventStatusUpdate = async (eventId, newStatus) => {
        try {
            await updateEventStatus(eventId, newStatus);
            toast.success(`Event has been ${newStatus}.`);
            fetchPendingEvents();
        } catch (error) {
            toast.error("Failed to update event status.");
        }
    };

    return (
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-sky-400">Admin Dashboard</h2>
                <p className="mt-2 text-gray-400">Manage your college settings and approve new events.</p>
                <Link to="/college-admin" className="mt-4 inline-block px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-700">
                    Go to Settings
                </Link>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-white">Events Pending Approval</h3>
                {loading ? (
                    <p className="mt-4">Loading pending events...</p>
                ) : pendingEvents.length > 0 ? (
                    <div className="mt-4 space-y-4">
                        {pendingEvents.map(event => (
                            <div key={event.id} className="bg-slate-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div>
                                    <p className="font-bold text-white">{event.title}</p>
                                    <p className="text-sm text-gray-400">By: {event.organizerName}</p>
                                    <p className="text-sm text-gray-400">Date: {new Date(event.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex space-x-2 mt-4 sm:mt-0">
                                    <button onClick={() => handleEventStatusUpdate(event.id, 'approved')} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-lg">Approve</button>
                                    <button onClick={() => handleEventStatusUpdate(event.id, 'rejected')} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-4 text-gray-500">There are no events waiting for approval.</p>
                )}
            </div>
        </div>
    );
};


function HomePage() {
    const { userData, loading } = useAuth();
    const [isCreateEventModalOpen, setCreateEventModalOpen] = useState(false);

    const renderDashboard = () => {
        if (!userData) return <p>Loading user data...</p>;
        switch (userData.role) {
            case 'student':
                return <StudentDashboard userData={userData} />;
            case 'club-lead':
                return <ClubLeadDashboard userData={userData} onOpenCreateEvent={() => setCreateEventModalOpen(true)} />;
            case 'collegeAdmin':
                return <AdminDashboard userData={userData} />;
            case 'webAppAdmin':
                return (
                    <div className="bg-slate-800 p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-sky-400">WebApp Admin Dashboard</h2>
                        <p className="mt-4 text-gray-300">Welcome! Manage colleges from the <Link to="/admin" className="text-sky-400 hover:underline">WebApp Admin Portal</Link>.</p>
                    </div>
                );
            default:
                return <StudentDashboard userData={userData} />;
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <DashboardHeader onOpenCreateEvent={() => setCreateEventModalOpen(true)} />

            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
                        {renderDashboard()}
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isCreateEventModalOpen}
                onClose={() => setCreateEventModalOpen(false)}
                title="Create a New Event"
            >
                <CreateEventForm onClose={() => setCreateEventModalOpen(false)} />
            </Modal>
        </div>
    );
}

export default HomePage;