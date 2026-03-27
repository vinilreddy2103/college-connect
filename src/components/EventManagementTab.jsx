import React, { useState, useEffect } from 'react';
import { getApprovedEventsByCollege, getPendingEventsByCollege, updateEventStatus, deleteEvent, updateEvent } from '../firebase';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaCheck, FaTimes, FaEye, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function EventManagementTab({ collegeId }) {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        loadEvents();
    }, [collegeId]);

    useEffect(() => {
        filterEvents();
    }, [events, searchTerm, statusFilter]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            // Load all events (approved and pending)
            const [approved, pending] = await Promise.all([
                getApprovedEventsByCollege(collegeId),
                getPendingEventsByCollege(collegeId)
            ]);
            
            const allEvents = [
                ...approved.map(e => ({ ...e, status: 'approved' })),
                ...pending.map(e => ({ ...e, status: 'pending' }))
            ];
            
            setEvents(allEvents);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Failed to load events');
        }
        setLoading(false);
    };

    const filterEvents = () => {
        let filtered = [...events];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(e => e.status === statusFilter);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.title?.toLowerCase().includes(search) ||
                e.organizerName?.toLowerCase().includes(search) ||
                e.venue?.toLowerCase().includes(search)
            );
        }

        setFilteredEvents(filtered);
    };

    const handleStatusUpdate = async (eventId, newStatus) => {
        try {
            await updateEventStatus(eventId, newStatus);
            toast.success(`Event ${newStatus} successfully!`);
            loadEvents();
        } catch (error) {
            console.error('Error updating event status:', error);
            toast.error('Failed to update event status');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedEvents.length === 0) {
            toast.warning('No events selected');
            return;
        }

        try {
            await Promise.all(selectedEvents.map(id => updateEventStatus(id, 'approved')));
            toast.success(`${selectedEvents.length} events approved!`);
            setSelectedEvents([]);
            loadEvents();
        } catch (error) {
            console.error('Error bulk approving:', error);
            toast.error('Failed to approve some events');
        }
    };

    const handleBulkReject = async () => {
        if (selectedEvents.length === 0) {
            toast.warning('No events selected');
            return;
        }

        try {
            await Promise.all(selectedEvents.map(id => updateEventStatus(id, 'rejected')));
            toast.success(`${selectedEvents.length} events rejected!`);
            setSelectedEvents([]);
            loadEvents();
        } catch (error) {
            console.error('Error bulk rejecting:', error);
            toast.error('Failed to reject some events');
        }
    };

    const handleDelete = async (eventId, eventTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteEvent(eventId);
            toast.success('Event deleted successfully!');
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Failed to delete event');
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setShowEditModal(true);
    };

    const toggleSelectEvent = (eventId) => {
        setSelectedEvents(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            approved: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Approved', icon: FaCheck },
            pending: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Pending', icon: FaCheckCircle },
            rejected: { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Rejected', icon: FaTimes },
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${badge.color}`}>
                <Icon /> {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="card p-8">
                <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Event Management</h1>
                <p className="text-gray-400">Manage, approve, and edit college events</p>
            </div>

            {/* Filters & Bulk Actions */}
            <div className="card p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search events by title, organizer, or venue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-12 pr-8 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedEvents.length > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                        <span className="text-sm text-white font-medium">
                            {selectedEvents.length} event(s) selected
                        </span>
                        <button
                            onClick={handleBulkApprove}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <FaCheck className="inline mr-2" /> Bulk Approve
                        </button>
                        <button
                            onClick={handleBulkReject}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <FaTimes className="inline mr-2" /> Bulk Reject
                        </button>
                        <button
                            onClick={() => setSelectedEvents([])}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-4 flex gap-4 text-sm">
                    <span className="text-gray-400">
                        Total: <span className="text-white font-semibold">{events.length}</span>
                    </span>
                    <span className="text-gray-400">
                        Showing: <span className="text-white font-semibold">{filteredEvents.length}</span>
                    </span>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <div key={event.id} className="card p-6 hover:border-indigo-500/50 transition-colors">
                            <div className="flex items-start gap-4">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedEvents.includes(event.id)}
                                    onChange={() => toggleSelectEvent(event.id)}
                                    className="mt-1 w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                />

                                {/* Event Image */}
                                {event.posterURL && (
                                    <img
                                        src={event.posterURL}
                                        alt={event.title}
                                        className="w-24 h-24 rounded-lg object-cover"
                                    />
                                )}

                                {/* Event Details */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
                                            <p className="text-sm text-gray-400">
                                                By {event.organizerName} • {new Date(event.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {getStatusBadge(event.status)}
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                                        <span>📍 {event.venue}</span>
                                        <span>🕐 {event.time}</span>
                                        {event.isPaid && <span>💰 ₹{event.price}</span>}
                                        <span>👥 {event.registrationCount || 0} registered</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        {event.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(event.id, 'approved')}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
                                                >
                                                    <FaCheck className="inline mr-1" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(event.id, 'rejected')}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                                                >
                                                    <FaTimes className="inline mr-1" /> Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                                        >
                                            <FaEdit className="inline mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => navigate(`/event/${event.id}`)}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                                        >
                                            <FaEye className="inline mr-1" /> View
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id, event.title)}
                                            className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 text-sm rounded-lg transition-colors"
                                        >
                                            <FaTrash className="inline mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card p-12 text-center text-gray-400">
                        No events found matching your criteria
                    </div>
                )}
            </div>

            {/* Edit Event Modal */}
            {showEditModal && editingEvent && (
                <EditEventModal
                    event={editingEvent}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingEvent(null);
                    }}
                    onSuccess={() => {
                        loadEvents();
                        setShowEditModal(false);
                        setEditingEvent(null);
                    }}
                />
            )}
        </div>
    );
}

// Edit Event Modal Component
function EditEventModal({ event, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        time: event.time || '',
        venue: event.venue || '',
        price: event.price || 0,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateEvent(event.id, formData);
            toast.success('Event updated successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error updating event:', error);
            toast.error('Failed to update event');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-800 my-8">
                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white">Edit Event</h2>
                    <p className="text-sm text-gray-400 mt-1">Update event details</p>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            required
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {event.isPaid && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                required
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventManagementTab;
