import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    getEventsByOrganizer, 
    getOrganizerStats,
    cancelEvent,
    updateEventDetails,
    getEventRegistrations
} from '../firebase';
import DashboardHeader from '../components/DashboardHeader';
import EventCard from '../components/EventCard';
import { toast } from 'react-toastify';
import { 
    FaCalendarAlt, FaUsers, FaRupeeSign, FaChartLine,
    FaFilter, FaSearch, FaTimes, FaEdit, FaTrash,
    FaEye, FaDownload, FaSpinner, FaCalendarCheck,
    FaCalendarTimes, FaBan
} from 'react-icons/fa';

// Registrations Modal Component
function RegistrationsModal({ event, onClose }) {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadRegistrations();
    }, [event.id]);

    const loadRegistrations = async () => {
        try {
            const regs = await getEventRegistrations(event.id);
            setRegistrations(regs);
        } catch (error) {
            toast.error('Failed to load registrations');
        } finally {
            setLoading(false);
        }
    };

    const filteredRegistrations = registrations.filter(reg => 
        reg.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Registration Time', 'Payment Status', 'Amount'];
        const rows = registrations.map(reg => [
            reg.displayName || 'N/A',
            reg.email || 'N/A',
            reg.registrationTime ? new Date(reg.registrationTime).toLocaleString() : 'N/A',
            reg.payment?.status || 'Free',
            reg.payment?.amount ? `₹${reg.payment.amount / 100}` : '-'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title.replace(/\s+/g, '_')}_registrations.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Registrations exported!');
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{event.title}</h2>
                        <p className="text-gray-400 text-sm">
                            {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition text-sm"
                        >
                            <FaDownload /> Export CSV
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <FaTimes size={24} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-700">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Registrations List */}
                <div className="overflow-y-auto max-h-[60vh] p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-purple-400 text-2xl" />
                        </div>
                    ) : filteredRegistrations.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            {searchTerm ? 'No matching registrations found' : 'No registrations yet'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRegistrations.map((reg, index) => (
                                <div 
                                    key={reg.id} 
                                    className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{reg.displayName || 'Unknown'}</p>
                                            <p className="text-sm text-gray-400">{reg.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">
                                            {reg.registrationTime ? new Date(reg.registrationTime).toLocaleDateString() : '-'}
                                        </p>
                                        {reg.payment && (
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                reg.payment.status === 'success' 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                ₹{reg.payment.amount / 100} - {reg.payment.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Edit Event Modal Component
function EditEventModal({ event, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: event.title || '',
        description: event.description || '',
        venue: event.venue || '',
        date: event.date?.toDate ? event.date.toDate().toISOString().split('T')[0] : event.date?.split('T')[0] || '',
        time: event.time || '',
    });
    const [saving, setSaving] = useState(false);
    const [notifyUsers, setNotifyUsers] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateEventDetails(event.id, formData, notifyUsers);
            toast.success('Event updated successfully!');
            onSave();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Edit Event</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Venue</label>
                        <input
                            type="text"
                            value={formData.venue}
                            onChange={(e) => setFormData({...formData, venue: e.target.value})}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Time</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-gray-300">
                        <input
                            type="checkbox"
                            checked={notifyUsers}
                            onChange={(e) => setNotifyUsers(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        Notify registered users about changes
                    </label>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Cancel Event Modal
function CancelEventModal({ event, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await cancelEvent(event.id, reason);
            toast.success('Event cancelled. Registered users have been notified.');
            onConfirm();
            onClose();
        } catch (error) {
            toast.error('Failed to cancel event');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Cancel Event</h2>
                <p className="text-gray-400 mb-4">
                    Are you sure you want to cancel "{event.title}"? 
                    All registered users will be notified.
                </p>
                
                <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Reason (optional)</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Venue unavailable, scheduling conflict..."
                        rows={3}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white resize-none"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600 transition"
                    >
                        Keep Event
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {cancelling ? 'Cancelling...' : 'Cancel Event'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrganizedEventsPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showRegistrations, setShowRegistrations] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showCancel, setShowCancel] = useState(false);

    useEffect(() => {
        if (userData?.uid) {
            loadData();
        }
    }, [userData]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [eventsData, statsData] = await Promise.all([
                getEventsByOrganizer(userData.uid),
                getOrganizerStats(userData.uid)
            ]);
            setEvents(eventsData);
            setStats(statsData);
        } catch (error) {
            toast.error('Failed to load your events');
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();

    const filteredEvents = events.filter(event => {
        // Search filter
        if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Status filter
        const eventDate = event.date?.toDate?.() || new Date(event.date);
        
        switch (filter) {
            case 'upcoming':
                return event.status !== 'cancelled' && eventDate > now;
            case 'past':
                return event.status !== 'cancelled' && eventDate <= now;
            case 'cancelled':
                return event.status === 'cancelled';
            default:
                return true;
        }
    });

    const handleViewDetails = (eventId) => {
        navigate(`/event/${eventId}`);
    };

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardHeader />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">My Organized Events</h1>
                    <p className="text-gray-400">Manage events you've created and track registrations</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-500/20 p-2 rounded-lg">
                                    <FaCalendarAlt className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                                    <p className="text-xs text-gray-400">Total Events</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/20 p-2 rounded-lg">
                                    <FaUsers className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.totalRegistrations}</p>
                                    <p className="text-xs text-gray-400">Registrations</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500/20 p-2 rounded-lg">
                                    <FaRupeeSign className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">₹{stats.totalRevenue}</p>
                                    <p className="text-xs text-gray-400">Revenue</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-cyan-500/20 p-2 rounded-lg">
                                    <FaCalendarCheck className="text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.upcomingEvents}</p>
                                    <p className="text-xs text-gray-400">Upcoming</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-500/20 p-2 rounded-lg">
                                    <FaCalendarTimes className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.pastEvents}</p>
                                    <p className="text-xs text-gray-400">Past</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500/20 p-2 rounded-lg">
                                    <FaBan className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.cancelledEvents}</p>
                                    <p className="text-xs text-gray-400">Cancelled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search events..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400"
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        {['all', 'upcoming', 'past', 'cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                    filter === f
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-800 text-gray-400 hover:text-white'
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Events List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <FaSpinner className="animate-spin text-purple-400 text-3xl" />
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-20">
                        <FaCalendarAlt className="mx-auto text-5xl text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {events.length === 0 ? "You haven't created any events yet" : "No matching events"}
                        </h3>
                        <p className="text-gray-400">
                            {events.length === 0 
                                ? "Create your first event to see it here"
                                : "Try adjusting your search or filter"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map(event => (
                            <div key={event.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    {/* Event Poster */}
                                    <div className="md:w-48 h-32 md:h-auto">
                                        <img 
                                            src={event.posterUrl || '/default-event.png'} 
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    
                                    {/* Event Info */}
                                    <div className="flex-1 p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                                                    {event.status === 'cancelled' && (
                                                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                    {event.status === 'pending' && (
                                                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">
                                                            Pending Approval
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm mb-2">
                                                    {event.date?.toDate 
                                                        ? event.date.toDate().toLocaleDateString('en-IN', { 
                                                            weekday: 'short', 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                          })
                                                        : new Date(event.date).toLocaleDateString('en-IN', { 
                                                            weekday: 'short', 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                          })
                                                    } • {event.time} • {event.venue}
                                                </p>
                                                
                                                {/* Stats Row */}
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <span className="text-gray-400">
                                                        <FaUsers className="inline mr-1" />
                                                        {event.registrationCount || 0}
                                                        {event.hasCapacity && `/${event.maxCapacity}`} registered
                                                    </span>
                                                    {event.isPaid && (
                                                        <span className="text-green-400">
                                                            <FaRupeeSign className="inline mr-1" />
                                                            {event.price / 100} per ticket
                                                        </span>
                                                    )}
                                                    {event.isPaid && event.registrationCount > 0 && (
                                                        <span className="text-cyan-400">
                                                            ₹{(event.price * event.registrationCount) / 100} revenue
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEvent(event);
                                                        setShowRegistrations(true);
                                                    }}
                                                    className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition text-sm"
                                                >
                                                    <FaEye /> Registrations
                                                </button>
                                                
                                                {event.status !== 'cancelled' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setShowEdit(true);
                                                            }}
                                                            className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg hover:bg-purple-500/30 transition text-sm"
                                                        >
                                                            <FaEdit /> Edit
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setShowCancel(true);
                                                            }}
                                                            className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition text-sm"
                                                        >
                                                            <FaTimes /> Cancel
                                                        </button>
                                                    </>
                                                )}
                                                
                                                <button
                                                    onClick={() => handleViewDetails(event.id)}
                                                    className="flex items-center gap-1 bg-slate-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-slate-600 transition text-sm"
                                                >
                                                    View Page
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showRegistrations && selectedEvent && (
                <RegistrationsModal 
                    event={selectedEvent} 
                    onClose={() => {
                        setShowRegistrations(false);
                        setSelectedEvent(null);
                    }} 
                />
            )}
            
            {showEdit && selectedEvent && (
                <EditEventModal 
                    event={selectedEvent} 
                    onClose={() => {
                        setShowEdit(false);
                        setSelectedEvent(null);
                    }}
                    onSave={loadData}
                />
            )}
            
            {showCancel && selectedEvent && (
                <CancelEventModal 
                    event={selectedEvent} 
                    onClose={() => {
                        setShowCancel(false);
                        setSelectedEvent(null);
                    }}
                    onConfirm={loadData}
                />
            )}
        </div>
    );
}

export default OrganizedEventsPage;
