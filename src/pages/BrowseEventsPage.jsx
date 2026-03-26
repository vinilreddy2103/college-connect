import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { browseEvents, searchEvents, getAllColleges, getUniqueVenues } from '../firebase';
import { FaSearch, FaFilter, FaTimes, FaFire, FaCalendarAlt, FaClock, FaCompass, FaSlidersH, FaRupeeSign, FaTicketAlt } from 'react-icons/fa';
import EventCard from '../components/EventCard';
import EventDetailsModal from '../components/EventDetailsModal';
import DashboardHeader from '../components/DashboardHeader';
import { EventCardSkeleton } from '../components/ui/Skeleton';

function BrowseEventsPage() {
    const { userData, registeredEvents } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const [filters, setFilters] = useState({
        collegeId: '',
        venue: '',
        dateFrom: '',
        dateTo: '',
        sortBy: 'date',
        registrationStatus: 'all',
        priceFilter: 'all' // 'all' | 'free' | 'paid'
    });

    const [colleges, setColleges] = useState([]);
    const [venues, setVenues] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadFilterOptions = async () => {
            const [collegesList, venuesList] = await Promise.all([
                getAllColleges(),
                getUniqueVenues()
            ]);
            setColleges(collegesList);
            setVenues(venuesList);
        };
        loadFilterOptions();
    }, []);

    useEffect(() => {
        loadEvents();
    }, [filters]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const result = await browseEvents(filters, null, 12);
            let filteredEvents = result.events;

            // Apply price filter client-side for 'free' (to include legacy events without isPaid field)
            if (filters.priceFilter === 'free') {
                filteredEvents = filteredEvents.filter(e => !e.isPaid);
            }

            if (filters.registrationStatus === 'registered') {
                filteredEvents = filteredEvents.filter(e => registeredEvents?.has(e.id));
            } else if (filters.registrationStatus === 'not_registered') {
                filteredEvents = filteredEvents.filter(e => !registeredEvents?.has(e.id));
            }

            setEvents(filteredEvents);
            setLastDoc(result.lastVisible);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error("Error loading events:", error);
        }
        setLoading(false);
    };

    const loadMoreEvents = async () => {
        if (!hasMore || loadingMore) return;
        
        setLoadingMore(true);
        try {
            const result = await browseEvents(filters, lastDoc, 12);
            let filteredEvents = result.events;

            // Apply price filter client-side for 'free' (to include legacy events without isPaid field)
            if (filters.priceFilter === 'free') {
                filteredEvents = filteredEvents.filter(e => !e.isPaid);
            }

            if (filters.registrationStatus === 'registered') {
                filteredEvents = filteredEvents.filter(e => registeredEvents?.has(e.id));
            } else if (filters.registrationStatus === 'not_registered') {
                filteredEvents = filteredEvents.filter(e => !registeredEvents?.has(e.id));
            }

            setEvents(prev => [...prev, ...filteredEvents]);
            setLastDoc(result.lastVisible);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error("Error loading more events:", error);
        }
        setLoadingMore(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            loadEvents();
            return;
        }

        setLoading(true);
        try {
            const results = await searchEvents(searchTerm, filters.collegeId || null);
            // Apply price filter to search results as well
            let filteredResults = results;
            if (filters.priceFilter === 'free') {
                filteredResults = filteredResults.filter(e => !e.isPaid);
            } else if (filters.priceFilter === 'paid') {
                filteredResults = filteredResults.filter(e => e.isPaid);
            }
            setEvents(filteredResults);
            setHasMore(false);
        } catch (error) {
            console.error("Error searching events:", error);
        }
        setLoading(false);
    };

    const clearFilters = () => {
        setFilters({
            collegeId: '',
            venue: '',
            dateFrom: '',
            dateTo: '',
            sortBy: 'date',
            registrationStatus: 'all',
            priceFilter: 'all'
        });
        setSearchTerm('');
    };

    const handleViewDetails = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const activeFilterCount = Object.entries(filters).filter(([key, v]) => {
        if (key === 'sortBy') return v !== 'date';
        if (key === 'registrationStatus') return v !== 'all';
        if (key === 'priceFilter') return v !== 'all';
        return v;
    }).length;

    return (
        <div className="page-container">
            <DashboardHeader />

            <main className="page-content">
                {/* Page Header */}
                <div className="page-header">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20">
                            <FaCompass className="text-2xl text-fuchsia-400" />
                        </div>
                        <h1 className="page-title">Browse Events</h1>
                    </div>
                    <p className="page-subtitle">Discover amazing events happening around you</p>
                </div>

                {/* Quick Price Filter Pills */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={() => setFilters({ ...filters, priceFilter: 'all' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                            filters.priceFilter === 'all'
                                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                        }`}
                    >
                        <FaTicketAlt />
                        All Events
                    </button>
                    <button
                        onClick={() => setFilters({ ...filters, priceFilter: 'free' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                            filters.priceFilter === 'free'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                        }`}
                    >
                        Free Only
                    </button>
                    <button
                        onClick={() => setFilters({ ...filters, priceFilter: 'paid' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                            filters.priceFilter === 'paid'
                                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25'
                                : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                        }`}
                    >
                        <FaRupeeSign />
                        Paid Events
                    </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="card p-5 mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search events by title, description, or venue..."
                                    className="input-base pl-11"
                                />
                            </div>
                        </form>

                        {/* Filter Toggle Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                                showFilters || activeFilterCount > 0
                                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                                    : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                            }`}
                        >
                            <FaSlidersH />
                            <span>Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Expanded Filters Panel */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-slate-700/50 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">College</label>
                                    <select
                                        value={filters.collegeId}
                                        onChange={(e) => setFilters({ ...filters, collegeId: e.target.value })}
                                        className="select-base"
                                    >
                                        <option value="">All Colleges</option>
                                        {colleges.map(college => (
                                            <option key={college.id} value={college.id}>{college.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Venue</label>
                                    <select
                                        value={filters.venue}
                                        onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
                                        className="select-base"
                                    >
                                        <option value="">All Venues</option>
                                        {venues.map(venue => (
                                            <option key={venue} value={venue}>{venue}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                        className="select-base"
                                    >
                                        <option value="date">Event Date</option>
                                        <option value="popularity">Popularity (Most Liked)</option>
                                        <option value="newest">Recently Added</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="input-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                        className="input-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Registration</label>
                                    <select
                                        value={filters.registrationStatus}
                                        onChange={(e) => setFilters({ ...filters, registrationStatus: e.target.value })}
                                        className="select-base"
                                    >
                                        <option value="all">All Events</option>
                                        <option value="registered">Registered Only</option>
                                        <option value="not_registered">Not Registered</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="btn-ghost flex items-center gap-2"
                                >
                                    <FaTimes />
                                    <span>Clear Filters</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sort Indicator Pills */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {filters.sortBy === 'popularity' && (
                        <span className="badge badge-gradient flex items-center gap-2">
                            <FaFire className="text-orange-400" /> Sorted by Popularity
                        </span>
                    )}
                    {filters.sortBy === 'newest' && (
                        <span className="badge badge-success flex items-center gap-2">
                            <FaClock /> Recently Added
                        </span>
                    )}
                    {filters.sortBy === 'date' && (
                        <span className="badge flex items-center gap-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <FaCalendarAlt /> By Event Date
                        </span>
                    )}
                    {searchTerm && (
                        <span className="badge flex items-center gap-2 bg-slate-700 text-gray-300 border border-slate-600">
                            <FaSearch className="text-xs" /> "{searchTerm}"
                        </span>
                    )}
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <EventCardSkeleton key={i} />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="card text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <FaCompass className="text-3xl text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
                        <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
                        <button
                            onClick={clearFilters}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <FaTimes />
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="text-center mt-10">
                                <button
                                    onClick={loadMoreEvents}
                                    disabled={loadingMore}
                                    className="btn-secondary inline-flex items-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More Events'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <EventDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                event={selectedEvent}
            />
        </div>
    );
}

export default BrowseEventsPage;
