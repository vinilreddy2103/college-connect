import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import { 
    getFacultyStats, 
    getFacultyClubs, 
    getAllPendingRequestsForFaculty,
    getFacultyEvents,
    approveJoinRequest,
    rejectJoinRequest,
    getClubPaymentHistory,
    getFacultyFests,
    getPendingFestEvents,
    getPendingClubEvents,
    approveFestEvent,
    rejectFestEvent,
    getFestStats
} from '../firebase';
import { 
    FaUsers, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaClipboardList,
    FaUserClock,
    FaCheck,
    FaTimes,
    FaEye,
    FaChevronRight,
    FaBuilding,
    FaTrophy
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function FacultyDashboardPage() {
    const { currentUser, userData } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [events, setEvents] = useState([]);
    const [eventFilter, setEventFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [processingRequest, setProcessingRequest] = useState(null);
    const [fests, setFests] = useState([]);
    const [pendingClubEvents, setPendingClubEvents] = useState([]);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser && activeTab === 'events') {
            loadEvents();
        }
    }, [currentUser, activeTab, eventFilter]);

    useEffect(() => {
        if (currentUser && activeTab === 'fests') {
            loadFests();
        }
    }, [currentUser, activeTab]);

    useEffect(() => {
        if (currentUser && activeTab === 'clubs' && clubs.length > 0) {
            loadPendingClubEvents();
        }
    }, [currentUser, activeTab, clubs]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsData, clubsData, requestsData] = await Promise.all([
                getFacultyStats(currentUser.uid),
                getFacultyClubs(currentUser.uid),
                getAllPendingRequestsForFaculty(currentUser.uid)
            ]);
            
            setStats(statsData);
            setClubs(clubsData);
            setPendingRequests(requestsData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadFests = async () => {
        try {
            const festsData = await getFacultyFests(currentUser.uid);
            // Load stats for each fest
            const festsWithStats = await Promise.all(
                festsData.map(async (fest) => {
                    const festStats = await getFestStats(fest.id);
                    return { ...fest, stats: festStats };
                })
            );
            setFests(festsWithStats);
        } catch (error) {
            console.error('Error loading fests:', error);
        }
    };

    const loadPendingClubEvents = async () => {
        try {
            // Load pending events for all clubs the faculty coordinates
            const allPendingEvents = await Promise.all(
                clubs.map(async (club) => {
                    const events = await getPendingClubEvents(club.id);
                    return events.map(event => ({ ...event, club }));
                })
            );
            setPendingClubEvents(allPendingEvents.flat());
        } catch (error) {
            console.error('Error loading pending club events:', error);
        }
    };

    const handleApproveClubEvent = async (eventId) => {
        try {
            setProcessingRequest(eventId);
            await approveFestEvent(eventId); // Reuse - it just updates status
            toast.success('Event approved!');
            loadPendingClubEvents();
        } catch (error) {
            console.error('Error approving event:', error);
            toast.error('Failed to approve event');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleRejectClubEvent = async (eventId) => {
        try {
            setProcessingRequest(eventId);
            await rejectFestEvent(eventId); // Reuse - it just updates status
            toast.success('Event rejected');
            loadPendingClubEvents();
        } catch (error) {
            console.error('Error rejecting event:', error);
            toast.error('Failed to reject event');
        } finally {
            setProcessingRequest(null);
        }
    };

    const loadEvents = async () => {
        try {
            const eventsData = await getFacultyEvents(currentUser.uid, eventFilter);
            setEvents(eventsData);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const handleApprove = async (request) => {
        setProcessingRequest(request.id);
        try {
            await approveJoinRequest(request.clubId, request.id, currentUser.uid);
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));
            setStats(prev => prev ? { ...prev, pendingRequests: prev.pendingRequests - 1, totalMembers: prev.totalMembers + 1 } : prev);
            toast.success(`Approved ${request.userName}'s request`);
        } catch (error) {
            console.error('Error approving request:', error);
            toast.error('Failed to approve request');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleReject = async (request) => {
        setProcessingRequest(request.id);
        try {
            await rejectJoinRequest(request.clubId, request.id, currentUser.uid);
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));
            setStats(prev => prev ? { ...prev, pendingRequests: prev.pendingRequests - 1 } : prev);
            toast.success(`Rejected ${request.userName}'s request`);
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        } finally {
            setProcessingRequest(null);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FaClipboardList },
        { id: 'clubs', label: 'My Clubs', icon: FaBuilding },
        { id: 'fests', label: 'Fests', icon: FaTrophy },
        { id: 'approvals', label: 'Approvals', icon: FaUserClock, badge: stats?.pendingRequests },
        { id: 'events', label: 'Events', icon: FaCalendarAlt },
        { id: 'revenue', label: 'Revenue', icon: FaMoneyBillWave },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900">
                <DashboardHeader />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        <p className="text-gray-400">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardHeader />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        Faculty Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Manage your clubs, approve requests, and track performance
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <StatCard 
                        icon={FaBuilding} 
                        label="Clubs" 
                        value={stats?.totalClubs || 0}
                        color="purple"
                    />
                    <StatCard 
                        icon={FaUsers} 
                        label="Total Members" 
                        value={stats?.totalMembers || 0}
                        color="blue"
                    />
                    <StatCard 
                        icon={FaUserClock} 
                        label="Pending" 
                        value={stats?.pendingRequests || 0}
                        color="yellow"
                    />
                    <StatCard 
                        icon={FaCalendarAlt} 
                        label="Events" 
                        value={stats?.totalEvents || 0}
                        color="green"
                    />
                    <StatCard 
                        icon={FaMoneyBillWave} 
                        label="Revenue" 
                        value={`₹${((stats?.totalRevenue || 0) / 100).toLocaleString()}`}
                        color="emerald"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <tab.icon className="text-sm" />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
                    {activeTab === 'overview' && (
                        <OverviewTab 
                            clubs={clubs} 
                            pendingRequests={pendingRequests}
                            events={events}
                            stats={stats}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            processingRequest={processingRequest}
                            formatDate={formatDate}
                        />
                    )}
                    
                    {activeTab === 'clubs' && (
                        <ClubsTab 
                            clubs={clubs} 
                            pendingEvents={pendingClubEvents}
                            onApprove={handleApproveClubEvent}
                            onReject={handleRejectClubEvent}
                            processingRequest={processingRequest}
                            formatDate={formatDate}
                        />
                    )}

                    {activeTab === 'fests' && (
                        <FestsTab fests={fests} onRefresh={loadFests} formatDate={formatDate} />
                    )}
                    
                    {activeTab === 'approvals' && (
                        <ApprovalsTab 
                            pendingRequests={pendingRequests}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            processingRequest={processingRequest}
                            formatDate={formatDate}
                        />
                    )}
                    
                    {activeTab === 'events' && (
                        <EventsTab 
                            events={events}
                            filter={eventFilter}
                            setFilter={setEventFilter}
                            formatDate={formatDate}
                        />
                    )}
                    
                    {activeTab === 'revenue' && (
                        <RevenueTab stats={stats} clubs={clubs} />
                    )}
                </div>
            </main>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
    const colorClasses = {
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
        green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
            <div className="flex items-center gap-3">
                <Icon className="text-2xl opacity-80" />
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

// Overview Tab
function OverviewTab({ clubs, pendingRequests, stats, onApprove, onReject, processingRequest, formatDate }) {
    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Quick Overview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Recent Clubs */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-white">My Clubs</h4>
                            <Link to="/clubs" className="text-purple-400 text-sm hover:text-purple-300">
                                View All
                            </Link>
                        </div>
                        {clubs.length === 0 ? (
                            <p className="text-gray-500 text-sm">No clubs yet</p>
                        ) : (
                            <div className="space-y-3">
                                {clubs.slice(0, 3).map(club => (
                                    <Link 
                                        key={club.id} 
                                        to={`/club/${club.id}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                        {club.logoURL ? (
                                            <img src={club.logoURL} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <FaBuilding className="text-purple-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{club.name}</p>
                                            <p className="text-gray-500 text-xs">{club.memberCount || 0} members</p>
                                        </div>
                                        <FaChevronRight className="text-gray-600" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pending Approvals */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-white">Pending Approvals</h4>
                            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                                {pendingRequests.length} pending
                            </span>
                        </div>
                        {pendingRequests.length === 0 ? (
                            <p className="text-gray-500 text-sm">No pending requests</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingRequests.slice(0, 3).map(request => (
                                    <div key={request.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
                                        {request.userPhotoURL ? (
                                            <img src={request.userPhotoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                <FaUsers className="text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{request.userName}</p>
                                            <p className="text-gray-500 text-xs truncate">{request.clubName}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onApprove(request)}
                                                disabled={processingRequest === request.id}
                                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                            >
                                                <FaCheck className="text-xs" />
                                            </button>
                                            <button
                                                onClick={() => onReject(request)}
                                                disabled={processingRequest === request.id}
                                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                            >
                                                <FaTimes className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Revenue Summary */}
            <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-4">Revenue Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-400">
                            ₹{((stats?.clubRevenue || 0) / 100).toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-sm">Club Memberships</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-400">
                            ₹{((stats?.eventRevenue || 0) / 100).toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-sm">Event Registrations</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-400">
                            ₹{((stats?.totalRevenue || 0) / 100).toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-sm">Total Revenue</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Clubs Tab
function ClubsTab({ clubs, pendingEvents = [], onApprove, onReject, processingRequest, formatDate }) {
    if (clubs.length === 0) {
        return (
            <div className="text-center py-12">
                <FaBuilding className="text-5xl text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Clubs Yet</h3>
                <p className="text-gray-400 mb-6">You haven't created any clubs as a coordinator.</p>
                <Link 
                    to="/clubs"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors"
                >
                    Create a Club
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Pending Event Submissions */}
            {pendingEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FaClipboardList className="text-yellow-500" />
                        Pending Event Submissions ({pendingEvents.length})
                    </h3>
                    <div className="space-y-4">
                        {pendingEvents.map(event => (
                            <div 
                                key={event.id}
                                className="bg-slate-900/50 rounded-xl p-4 border border-yellow-500/30"
                            >
                                <div className="flex items-start gap-4">
                                    {event.posterUrl ? (
                                        <img 
                                            src={event.posterUrl} 
                                            alt="" 
                                            className="w-20 h-20 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <FaCalendarAlt className="text-2xl text-purple-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white">{event.title}</h4>
                                        <p className="text-purple-400 text-sm">
                                            From: {event.club?.name || 'Unknown Club'}
                                        </p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {formatDate(event.date)} • {event.venue}
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                            {event.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => onApprove(event.id)}
                                            disabled={processingRequest === event.id}
                                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                            title="Approve"
                                        >
                                            <FaCheck />
                                        </button>
                                        <button
                                            onClick={() => onReject(event.id)}
                                            disabled={processingRequest === event.id}
                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                            title="Reject"
                                        >
                                            <FaTimes />
                                        </button>
                                        <Link
                                            to={`/event/${event.id}`}
                                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Clubs List */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Your Clubs</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clubs.map(club => (
                        <Link 
                            key={club.id}
                            to={`/club/${club.id}`}
                            className="bg-slate-900/50 rounded-xl p-4 hover:bg-slate-800/50 transition-colors border border-slate-700/50 hover:border-purple-500/30"
                        >
                            <div className="flex items-start gap-4">
                                {club.logoURL ? (
                                    <img src={club.logoURL} alt="" className="w-16 h-16 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <FaBuilding className="text-2xl text-purple-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate">{club.name}</h3>
                                    <p className="text-gray-500 text-sm truncate">{club.category}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <FaUsers /> {club.memberCount || 0}
                                        </span>
                                        {club.isPaid ? (
                                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                                ₹{club.membershipFee / 100}
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                                Free
                                            </span>
                                        )}
                                        {club.requiresApproval && (
                                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                Approval
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Approvals Tab
function ApprovalsTab({ pendingRequests, onApprove, onReject, processingRequest, formatDate }) {
    if (pendingRequests.length === 0) {
        return (
            <div className="text-center py-12">
                <FaCheck className="text-5xl text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                <p className="text-gray-400">No pending join requests at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-gray-400 text-sm">
                {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
            </p>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-gray-400 text-sm border-b border-slate-700">
                            <th className="pb-3 font-medium">Student</th>
                            <th className="pb-3 font-medium">Club</th>
                            <th className="pb-3 font-medium">Requested</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {pendingRequests.map(request => (
                            <tr key={request.id} className="hover:bg-slate-800/30">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        {request.userPhotoURL ? (
                                            <img src={request.userPhotoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                <FaUsers className="text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-medium">{request.userName}</p>
                                            <p className="text-gray-500 text-xs">{request.userEmail}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2">
                                        {request.clubLogoURL ? (
                                            <img src={request.clubLogoURL} alt="" className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                                                <FaBuilding className="text-purple-400 text-xs" />
                                            </div>
                                        )}
                                        <span className="text-gray-300">{request.clubName}</span>
                                    </div>
                                </td>
                                <td className="py-4 text-gray-400 text-sm">
                                    {formatDate(request.requestedAt)}
                                </td>
                                <td className="py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onApprove(request)}
                                            disabled={processingRequest === request.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 text-sm"
                                        >
                                            <FaCheck /> Approve
                                        </button>
                                        <button
                                            onClick={() => onReject(request)}
                                            disabled={processingRequest === request.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm"
                                        >
                                            <FaTimes /> Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Events Tab
function EventsTab({ events, filter, setFilter, formatDate }) {
    return (
        <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
                {['all', 'upcoming', 'past'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                            filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12">
                    <FaCalendarAlt className="text-5xl text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Events</h3>
                    <p className="text-gray-400">You haven't created any events yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {events.map(event => (
                        <Link
                            key={event.id}
                            to={`/event/${event.id}`}
                            className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-800/50 transition-colors"
                        >
                            {event.imageURL ? (
                                <img src={event.imageURL} alt="" className="w-20 h-20 rounded-lg object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                    <FaCalendarAlt className="text-2xl text-purple-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{event.name}</h3>
                                <p className="text-gray-500 text-sm">{event.date} • {event.time}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <FaUsers /> {event.registrationCount || 0} registered
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                        event.status === 'approved' 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : event.status === 'pending'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {event.status}
                                    </span>
                                    {event.isPaid && (
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                            ₹{event.price / 100}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <FaChevronRight className="text-gray-600" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// Revenue Tab
function RevenueTab({ stats, clubs }) {
    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-emerald-400">
                        ₹{((stats?.clubRevenue || 0) / 100).toLocaleString()}
                    </p>
                    <p className="text-gray-400 mt-1">Club Memberships</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-blue-400">
                        ₹{((stats?.eventRevenue || 0) / 100).toLocaleString()}
                    </p>
                    <p className="text-gray-400 mt-1">Event Registrations</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-6 text-center border-2 border-purple-500/30">
                    <p className="text-3xl font-bold text-purple-400">
                        ₹{((stats?.totalRevenue || 0) / 100).toLocaleString()}
                    </p>
                    <p className="text-gray-400 mt-1">Total Revenue</p>
                </div>
            </div>

            {/* Revenue by Club */}
            <div>
                <h4 className="font-medium text-white mb-4">Revenue by Club</h4>
                {clubs.filter(c => c.isPaid).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No paid clubs</p>
                ) : (
                    <div className="space-y-3">
                        {clubs.filter(c => c.isPaid).map(club => (
                            <div key={club.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                                {club.logoURL ? (
                                    <img src={club.logoURL} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <FaBuilding className="text-purple-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-white font-medium">{club.name}</p>
                                    <p className="text-gray-500 text-sm">
                                        {club.memberCount || 0} members × ₹{club.membershipFee / 100}
                                    </p>
                                </div>
                                <p className="text-emerald-400 font-semibold">
                                    ₹{(((club.memberCount || 0) * club.membershipFee) / 100).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Fests Tab Component
function FestsTab({ fests, onRefresh, formatDate }) {
    const [selectedFest, setSelectedFest] = useState(null);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [processingEvent, setProcessingEvent] = useState(null);

    const loadPendingEvents = async (festId) => {
        setLoadingEvents(true);
        try {
            const events = await getPendingFestEvents(festId);
            setPendingEvents(events);
        } catch (error) {
            console.error('Error loading pending events:', error);
        }
        setLoadingEvents(false);
    };

    const handleSelectFest = (fest) => {
        setSelectedFest(fest);
        loadPendingEvents(fest.id);
    };

    const handleApproveEvent = async (eventId) => {
        setProcessingEvent(eventId);
        try {
            await approveFestEvent(eventId);
            setPendingEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Event approved!');
            onRefresh();
        } catch (error) {
            console.error('Error approving event:', error);
            toast.error('Failed to approve event');
        }
        setProcessingEvent(null);
    };

    const handleRejectEvent = async (eventId) => {
        setProcessingEvent(eventId);
        try {
            await rejectFestEvent(eventId);
            setPendingEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Event rejected');
            onRefresh();
        } catch (error) {
            console.error('Error rejecting event:', error);
            toast.error('Failed to reject event');
        }
        setProcessingEvent(null);
    };

    if (fests.length === 0) {
        return (
            <div className="text-center py-12">
                <FaTrophy className="mx-auto text-5xl text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Fests Assigned</h3>
                <p className="text-gray-500">You're not a coordinator for any fests yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">My Fests</h2>

            {/* Fests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fests.map(fest => (
                    <div
                        key={fest.id}
                        onClick={() => handleSelectFest(fest)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedFest?.id === fest.id
                                ? 'bg-purple-500/20 border-purple-500'
                                : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            {fest.logoURL ? (
                                <img src={fest.logoURL} alt={fest.name} className="w-12 h-12 rounded-xl object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                    <FaTrophy className="text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{fest.name}</h3>
                                <p className="text-xs text-gray-400">
                                    {fest.startDate?.toLocaleDateString()} - {fest.endDate?.toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-800/50 rounded-lg p-2">
                                <p className="text-lg font-bold text-white">{fest.stats?.totalEvents || 0}</p>
                                <p className="text-xs text-gray-400">Events</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-2">
                                <p className="text-lg font-bold text-yellow-400">{fest.stats?.pendingEvents || 0}</p>
                                <p className="text-xs text-gray-400">Pending</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-2">
                                <p className="text-lg font-bold text-green-400">{fest.stats?.totalRegistrations || 0}</p>
                                <p className="text-xs text-gray-400">Regs</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Fest - Pending Events */}
            {selectedFest && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Pending Event Submissions - {selectedFest.name}
                    </h3>

                    {loadingEvents ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : pendingEvents.length === 0 ? (
                        <div className="text-center py-8 bg-slate-700/30 rounded-xl">
                            <FaCheck className="mx-auto text-3xl text-green-500 mb-2" />
                            <p className="text-gray-400">No pending events to review</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingEvents.map(event => (
                                <div key={event.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{event.title}</h4>
                                            <p className="text-sm text-gray-400 line-clamp-2 mt-1">{event.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <FaCalendarAlt size={12} />
                                                    {event.date?.toLocaleDateString()}
                                                </span>
                                                <span>by {event.organizerName}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApproveEvent(event.id)}
                                                disabled={processingEvent === event.id}
                                                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                                                title="Approve"
                                            >
                                                <FaCheck />
                                            </button>
                                            <button
                                                onClick={() => handleRejectEvent(event.id)}
                                                disabled={processingEvent === event.id}
                                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default FacultyDashboardPage;
