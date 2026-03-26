import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import Modal from '../components/Modal';
import CreateEventForm from '../components/CreateEventForm';
import EventCard from '../components/EventCard';
import { getApprovedEventsByCollege, getPendingEventsByCollege, updateEventStatus } from '../firebase';
import { toast } from 'react-toastify';
import EventDetailsModal from '../components/EventDetailsModal';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaArrowRight, FaPlus, FaCog, FaCheck, FaTimes, FaFire, FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { EventCardSkeleton, HeroSkeleton } from '../components/ui/Skeleton';
import LikeButton from '../components/LikeButton';
import ShareButton from '../components/ShareButton';

// Hero Carousel Component - Shows top 5 most liked events
const HeroCarousel = ({ events, onViewDetails }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [direction, setDirection] = useState('next');

    // Get top 5 events sorted by like count
    const topEvents = [...events]
        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        .slice(0, 5);

    const goToNext = useCallback(() => {
        setDirection('next');
        setCurrentIndex((prev) => (prev + 1) % topEvents.length);
    }, [topEvents.length]);

    const goToPrev = useCallback(() => {
        setDirection('prev');
        setCurrentIndex((prev) => (prev - 1 + topEvents.length) % topEvents.length);
    }, [topEvents.length]);

    const goToSlide = (index) => {
        setDirection(index > currentIndex ? 'next' : 'prev');
        setCurrentIndex(index);
    };

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying || topEvents.length <= 1) return;
        
        const interval = setInterval(goToNext, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, goToNext, topEvents.length]);

    // Pause on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

    if (topEvents.length === 0) return null;

    const currentEvent = topEvents[currentIndex];
    const eventDate = new Date(currentEvent.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div 
            className="relative rounded-3xl group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Images with transition */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
                {topEvents.map((event, index) => (
                    <div
                        key={event.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                            index === currentIndex 
                                ? 'opacity-100 scale-100' 
                                : 'opacity-0 scale-105'
                        }`}
                    >
                        <img 
                            src={event.posterURL || 'https://via.placeholder.com/1200x600.png?text=Featured+Event'} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
            </div>

            {/* Navigation Arrows */}
            {topEvents.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 hover:bg-slate-900/80 transition-all backdrop-blur-sm"
                    >
                        <FaChevronLeft />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 hover:bg-slate-900/80 transition-all backdrop-blur-sm"
                    >
                        <FaChevronRight />
                    </button>
                </>
            )}

            {/* Content */}
            <div 
                className="relative h-[400px] sm:h-[450px] flex flex-col justify-end p-6 sm:p-10 cursor-pointer"
                onClick={() => onViewDetails(currentEvent)}
            >
                {/* Rank Badge */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="badge bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-2">
                        <FaFire className="text-orange-400" /> #{currentIndex + 1} Trending
                    </span>
                    {currentEvent.likeCount > 0 && (
                        <span className="badge bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <FaHeart className="text-xs" /> {currentEvent.likeCount} likes
                        </span>
                    )}
                </div>

                {/* Title with animation */}
                <h2 
                    key={currentEvent.id + '-title'}
                    className="text-3xl sm:text-4xl font-bold text-white mb-3 line-clamp-2 animate-fade-in"
                >
                    {currentEvent.title}
                </h2>

                {/* Description */}
                <p 
                    key={currentEvent.id + '-desc'}
                    className="text-gray-300 text-lg mb-4 line-clamp-2 max-w-2xl animate-fade-in"
                >
                    {currentEvent.description}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-400 mb-6">
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-fuchsia-400" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaClock className="text-fuchsia-400" />
                        <span>{currentEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-fuchsia-400" />
                        <span>{currentEvent.venue}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4">
                    <button 
                        className="btn-primary inline-flex items-center gap-2"
                        onClick={(e) => { e.stopPropagation(); onViewDetails(currentEvent); }}
                    >
                        View Details <FaArrowRight />
                    </button>
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <LikeButton 
                            eventId={currentEvent.id} 
                            eventTitle={currentEvent.title}
                            eventPosterURL={currentEvent.posterURL}
                        />
                        <ShareButton
                            eventId={currentEvent.id}
                            eventTitle={currentEvent.title}
                            eventDescription={currentEvent.description}
                        />
                    </div>
                </div>
            </div>

            {/* Dots Indicator */}
            {topEvents.length > 1 && (
                <div className="absolute bottom-6 right-6 sm:right-10 flex items-center gap-2 z-20">
                    {topEvents.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                            className={`transition-all duration-300 rounded-full ${
                                index === currentIndex 
                                    ? 'w-8 h-2 bg-gradient-to-r from-fuchsia-500 to-orange-500' 
                                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Progress bar for auto-play */}
            {topEvents.length > 1 && isAutoPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/50 rounded-b-3xl overflow-hidden">
                    <div 
                        key={currentIndex}
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-orange-500 animate-progress"
                        style={{ animation: 'progress 5s linear' }}
                    />
                </div>
            )}
        </div>
    );
};

// Student Dashboard
const StudentDashboard = ({ userData }) => {
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

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

    // Get top 5 liked events for carousel
    const sortedByLikes = [...events].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    const carouselEvents = sortedByLikes.slice(0, 5);

    return (
        <div className="space-y-10">
            {/* Loading State */}
            {loadingEvents ? (
                <div className="space-y-8">
                    <HeroSkeleton />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => <EventCardSkeleton key={i} />)}
                    </div>
                </div>
            ) : events.length > 0 ? (
                <>
                    {/* Hero Carousel - Top 5 most liked */}
                    {carouselEvents.length > 0 && (
                        <HeroCarousel 
                            events={events} 
                            onViewDetails={(evt) => setSelectedEvent(evt)}
                        />
                    )}

                    {/* All Events Section - includes carousel events too */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white">All Events</h3>
                                <span className="badge bg-slate-700 text-gray-300 border border-slate-600">
                                    {events.length} upcoming
                                </span>
                            </div>
                            <Link 
                                to="/browse" 
                                className="btn-ghost inline-flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300"
                            >
                                See All <FaArrowRight className="text-xs" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.slice(0, 6).map(event => (
                                <EventCard 
                                    key={event.id} 
                                    event={event} 
                                    onViewDetails={(evt) => setSelectedEvent(evt)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="card text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                        <FaCalendarAlt className="text-3xl text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No upcoming events</h3>
                    <p className="text-gray-400 mb-6">Check back soon for new events at your college!</p>
                    <Link to="/browse" className="btn-primary inline-flex items-center gap-2">
                        Browse All Events <FaArrowRight />
                    </Link>
                </div>
            )}

            {selectedEvent && (
                <EventDetailsModal 
                    isOpen={!!selectedEvent} 
                    event={selectedEvent} 
                    onClose={() => setSelectedEvent(null)} 
                />
            )}
        </div>
    );
};

// Club Lead Dashboard
const ClubLeadDashboard = ({ userData, onOpenCreateEvent }) => (
    <div className="card p-6 mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <FaPlus className="text-xl text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Club Lead Tools</h2>
                    <p className="text-gray-400 text-sm">Create and manage your club's events</p>
                </div>
            </div>
            <button 
                onClick={onOpenCreateEvent} 
                className="btn-primary flex items-center gap-2"
            >
                <FaPlus /> Create Event
            </button>
        </div>
    </div>
);

// College Admin Dashboard
const CollegeAdminDashboard = ({ userData }) => {
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
        <div className="space-y-8 animate-fade-in">
            {/* Admin Tools Card */}
            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                            <FaCog className="text-xl text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">College Admin</h2>
                            <p className="text-gray-400 text-sm">Manage your college settings and events</p>
                        </div>
                    </div>
                    <Link to="/college-admin" className="btn-secondary flex items-center gap-2">
                        <FaCog /> Settings
                    </Link>
                </div>
            </div>

            {/* Pending Events Card */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">Pending Approval</h3>
                        {pendingEvents.length > 0 && (
                            <span className="badge badge-warning">
                                {pendingEvents.length} pending
                            </span>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                    </div>
                ) : pendingEvents.length > 0 ? (
                    <div className="space-y-4">
                        {pendingEvents.map(event => (
                            <div 
                                key={event.id} 
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                            >
                                <div className="flex items-center gap-4">
                                    {event.posterURL && (
                                        <img 
                                            src={event.posterURL} 
                                            alt="" 
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    )}
                                    <div>
                                        <p className="font-semibold text-white">{event.title}</p>
                                        <p className="text-sm text-gray-400">
                                            By {event.organizerName} • {new Date(event.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button 
                                        onClick={() => handleEventStatusUpdate(event.id, 'approved')} 
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
                                    >
                                        <FaCheck className="text-sm" /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleEventStatusUpdate(event.id, 'rejected')} 
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors"
                                    >
                                        <FaTimes className="text-sm" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                            <FaCheck className="text-2xl text-emerald-400" />
                        </div>
                        <p className="text-gray-400">All caught up! No pending events.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


function HomePage() {
    const { userData, loading } = useAuth();
    const [isCreateEventModalOpen, setCreateEventModalOpen] = useState(false);

    const renderDashboard = () => {
        if (!userData) {
            return (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                </div>
            );
        }
        
        switch (userData.role) {
            case 'student':
                return <StudentDashboard userData={userData} />;
            case 'club-lead':
                return (
                    <>
                        <ClubLeadDashboard userData={userData} onOpenCreateEvent={() => setCreateEventModalOpen(true)} />
                        <StudentDashboard userData={userData} />
                    </>
                );
            case 'collegeAdmin':
                return <CollegeAdminDashboard userData={userData} />;
            default:
                return <StudentDashboard userData={userData} />;
        }
    };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <DashboardHeader onOpenCreateEvent={() => setCreateEventModalOpen(true)} />

            <main className="page-content">
                {/* Page Header */}
                <div className="page-header">
                    <h1 className="page-title">
                        Welcome back, <span className="gradient-text">{userData?.displayName?.split(' ')[0] || 'there'}</span>
                    </h1>
                    <p className="page-subtitle">
                        {userData?.collegeName ? `Events happening at ${userData.collegeName}` : 'Discover events happening around you'}
                    </p>
                </div>

                {renderDashboard()}
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