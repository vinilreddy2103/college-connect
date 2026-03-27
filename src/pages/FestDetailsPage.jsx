import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFestById, getFestEvents, getUserById } from '../firebase';
import { FaCalendarAlt, FaArrowLeft, FaBuilding, FaUsers, FaGlobe, FaPlus, FaUserTie } from 'react-icons/fa';
import DashboardHeader from '../components/DashboardHeader';
import EventCard from '../components/EventCard';
import Modal from '../components/Modal';
import CreateEventForm from '../components/CreateEventForm';

function FestDetailsPage() {
    const { festId } = useParams();
    const navigate = useNavigate();
    const { userData, currentUser } = useAuth();
    const [fest, setFest] = useState(null);
    const [events, setEvents] = useState([]);
    const [coordinators, setCoordinators] = useState({ faculty: [], students: [] });
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    useEffect(() => {
        if (festId) {
            loadFestData();
        }
    }, [festId]);

    const loadFestData = async () => {
        setLoading(true);
        try {
            // Load fest details
            const festData = await getFestById(festId);
            if (!festData) {
                navigate('/fests');
                return;
            }
            setFest(festData);

            // Load fest events (only approved for students)
            const festEvents = await getFestEvents(festId, false);
            setEvents(festEvents);

            // Load coordinator details
            const facultyPromises = (festData.facultyCoordinators || []).map(id => getUserById(id));
            const studentPromises = (festData.studentCoordinators || []).map(id => getUserById(id));
            
            const [facultyCoords, studentCoords] = await Promise.all([
                Promise.all(facultyPromises),
                Promise.all(studentPromises)
            ]);

            setCoordinators({
                faculty: facultyCoords.filter(Boolean),
                students: studentCoords.filter(Boolean)
            });
        } catch (error) {
            console.error('Error loading fest:', error);
        }
        setLoading(false);
    };

    const formatDateRange = (start, end) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        const startStr = start?.toLocaleDateString('en-US', options);
        const endStr = end?.toLocaleDateString('en-US', options);
        if (startStr === endStr) return startStr;
        return `${startStr} - ${endStr}`;
    };

    const getFestStatus = () => {
        if (!fest) return null;
        const now = new Date();
        if (fest.startDate > now) {
            const days = Math.ceil((fest.startDate - now) / (1000 * 60 * 60 * 24));
            return { label: `Starts in ${days} day${days > 1 ? 's' : ''}`, color: 'bg-blue-500/20 text-blue-400', active: false };
        }
        if (fest.endDate >= now) {
            return { label: 'Happening Now!', color: 'bg-green-500/20 text-green-400', active: true };
        }
        return { label: 'Ended', color: 'bg-gray-500/20 text-gray-400', active: false };
    };

    // Check if user can submit events (student during active/upcoming fest)
    const canSubmitEvent = () => {
        if (!fest || !userData) return false;
        const now = new Date();
        // Can submit if fest hasn't ended and user is a student
        return fest.endDate >= now && userData.role === 'student';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <DashboardHeader />
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-64 bg-slate-800 rounded-2xl mb-6"></div>
                        <div className="h-8 bg-slate-800 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-slate-800 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-64 bg-slate-800 rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!fest) {
        return (
            <div className="min-h-screen bg-slate-950">
                <DashboardHeader />
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Fest Not Found</h2>
                    <button
                        onClick={() => navigate('/fests')}
                        className="text-indigo-400 hover:text-indigo-300"
                    >
                        Back to Fests
                    </button>
                </div>
            </div>
        );
    }

    const status = getFestStatus();

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHeader />

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/fests')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <FaArrowLeft />
                    Back to Fests
                </button>

                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden mb-8">
                    {fest.posterURL ? (
                        <img
                            src={fest.posterURL}
                            alt={fest.name}
                            className="w-full h-64 md:h-80 object-cover"
                        />
                    ) : (
                        <div className="w-full h-64 md:h-80 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center">
                            <FaCalendarAlt className="text-8xl text-indigo-400/30" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
                    
                    {/* Fest Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex items-start gap-4">
                            {fest.logoURL ? (
                                <img
                                    src={fest.logoURL}
                                    alt={fest.name}
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-slate-900 shadow-xl"
                                />
                            ) : (
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                                    <span className="text-3xl font-bold text-white">
                                        {fest.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                    {fest.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                                        {status.label}
                                    </span>
                                    {fest.scope === 'college' ? (
                                        <span className="px-3 py-1 bg-slate-800/80 text-gray-300 text-sm rounded-full flex items-center gap-1">
                                            <FaBuilding size={12} /> College-wide
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-slate-800/80 text-gray-300 text-sm rounded-full flex items-center gap-1">
                                            <FaUsers size={12} /> {fest.branchName}
                                        </span>
                                    )}
                                    {fest.allowOtherColleges && (
                                        <span className="px-3 py-1 bg-slate-800/80 text-green-400 text-sm rounded-full flex items-center gap-1">
                                            <FaGlobe size={12} /> Open to All
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date & Info */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <FaCalendarAlt className="text-indigo-400 text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Event Dates</p>
                                <p className="text-white font-semibold">
                                    {formatDateRange(fest.startDate, fest.endDate)}
                                </p>
                            </div>
                        </div>

                        {canSubmitEvent() && (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all"
                            >
                                <FaPlus />
                                Submit Event
                            </button>
                        )}
                    </div>
                </div>

                {/* Coordinators */}
                {(coordinators.faculty.length > 0 || coordinators.students.length > 0) && (
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaUserTie className="text-indigo-400" />
                            Coordinators
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {coordinators.faculty.map(coord => (
                                <div key={coord.id} className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg">
                                    {coord.photoURL ? (
                                        <img src={coord.photoURL} alt={coord.displayName} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-400 text-sm font-medium">
                                            {coord.displayName?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-white font-medium">{coord.displayName}</p>
                                        <p className="text-xs text-gray-400">Faculty</p>
                                    </div>
                                </div>
                            ))}
                            {coordinators.students.map(coord => (
                                <div key={coord.id} className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg">
                                    {coord.photoURL ? (
                                        <img src={coord.photoURL} alt={coord.displayName} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 text-sm font-medium">
                                            {coord.displayName?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-white font-medium">{coord.displayName}</p>
                                        <p className="text-xs text-gray-400">Student Coord.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Events Section */}
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Fest Events ({events.length})
                    </h2>

                    {events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                            <FaCalendarAlt className="mx-auto text-4xl text-gray-600 mb-3" />
                            <p className="text-gray-400 mb-2">No events scheduled yet</p>
                            {canSubmitEvent() && (
                                <button
                                    onClick={() => setShowSubmitModal(true)}
                                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                                >
                                    Be the first to submit an event!
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Event Modal */}
            {showSubmitModal && (
                <Modal 
                    isOpen={showSubmitModal} 
                    onClose={() => setShowSubmitModal(false)}
                    title={`Submit Event for ${fest.name}`}
                >
                    <CreateEventForm
                        onClose={() => {
                            setShowSubmitModal(false);
                            loadFestData();
                        }}
                        festId={fest.id}
                        festName={fest.name}
                    />
                </Modal>
            )}
        </div>
    );
}

export default FestDetailsPage;
