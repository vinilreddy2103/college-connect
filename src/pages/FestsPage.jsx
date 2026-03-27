import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFestsForStudent } from '../firebase';
import { FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaGlobe, FaBuilding } from 'react-icons/fa';
import DashboardHeader from '../components/DashboardHeader';

function FestsPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [fests, setFests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [scopeFilter, setScopeFilter] = useState('all');

    useEffect(() => {
        if (userData?.collegeId) {
            loadFests();
        }
    }, [userData?.collegeId, userData?.branch]);

    const loadFests = async () => {
        setLoading(true);
        try {
            const festsList = await getFestsForStudent(userData.collegeId, userData.branch);
            setFests(festsList);
        } catch (error) {
            console.error('Error loading fests:', error);
        }
        setLoading(false);
    };

    // Filter fests by search and scope
    const filteredFests = fests.filter(fest => {
        const matchesSearch = fest.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesScope = scopeFilter === 'all' || fest.scope === scopeFilter;
        return matchesSearch && matchesScope;
    });

    // Separate active and past fests
    const now = new Date();
    const activeFests = filteredFests.filter(f => f.endDate >= now);
    const pastFests = filteredFests.filter(f => f.endDate < now);

    const formatDateRange = (start, end) => {
        const options = { month: 'short', day: 'numeric' };
        const startStr = start?.toLocaleDateString('en-US', options);
        const endStr = end?.toLocaleDateString('en-US', options);
        if (startStr === endStr) return startStr;
        return `${startStr} - ${endStr}`;
    };

    const getFestStatus = (fest) => {
        const now = new Date();
        if (fest.startDate > now) {
            const days = Math.ceil((fest.startDate - now) / (1000 * 60 * 60 * 24));
            return { label: `Starts in ${days} day${days > 1 ? 's' : ''}`, color: 'text-blue-400' };
        }
        if (fest.endDate >= now) {
            return { label: 'Happening Now!', color: 'text-green-400' };
        }
        return { label: 'Ended', color: 'text-gray-500' };
    };

    const FestCard = ({ fest }) => {
        const status = getFestStatus(fest);
        
        return (
            <div
                onClick={() => navigate(`/fest/${fest.id}`)}
                className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
                {/* Poster/Banner */}
                {fest.posterURL ? (
                    <div className="h-40 overflow-hidden">
                        <img
                            src={fest.posterURL}
                            alt={fest.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ) : (
                    <div className="h-40 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center">
                        <FaCalendarAlt className="text-5xl text-indigo-400/50" />
                    </div>
                )}

                <div className="p-5">
                    {/* Logo and Name */}
                    <div className="flex items-start gap-3 mb-3">
                        {fest.logoURL ? (
                            <img
                                src={fest.logoURL}
                                alt={fest.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-600"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <span className="text-lg font-bold text-white">
                                    {fest.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                                {fest.name}
                            </h3>
                            <p className={`text-sm font-medium ${status.color}`}>
                                {status.label}
                            </p>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <FaCalendarAlt className="text-indigo-400" />
                        <span>{formatDateRange(fest.startDate, fest.endDate)}</span>
                    </div>

                    {/* Scope Badge */}
                    <div className="flex items-center gap-2">
                        {fest.scope === 'college' ? (
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full flex items-center gap-1">
                                <FaBuilding size={10} /> College-wide
                            </span>
                        ) : (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                                <FaUsers size={10} /> {fest.branchName}
                            </span>
                        )}
                        {fest.allowOtherColleges && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                <FaGlobe size={10} /> Open
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const SkeletonCard = () => (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden animate-pulse">
            <div className="h-40 bg-slate-700"></div>
            <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-700"></div>
                    <div className="flex-1">
                        <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-3"></div>
                <div className="h-6 bg-slate-700 rounded w-24"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHeader />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        College Fests
                    </h1>
                    <p className="text-gray-400">
                        Discover and participate in college festivals and events
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search fests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Scope Filter */}
                    <select
                        value={scopeFilter}
                        onChange={(e) => setScopeFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="all">All Scopes</option>
                        <option value="college">College-wide</option>
                        <option value="branch">My Branch</option>
                    </select>
                </div>

                {/* Active Fests */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        {activeFests.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Active & Upcoming Fests
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeFests.map(fest => (
                                        <FestCard key={fest.id} fest={fest} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pastFests.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-400 mb-4">
                                    Past Fests
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                                    {pastFests.map(fest => (
                                        <FestCard key={fest.id} fest={fest} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredFests.length === 0 && (
                            <div className="text-center py-16">
                                <FaCalendarAlt className="mx-auto text-6xl text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                    No Fests Found
                                </h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'Try a different search term' : 'Check back later for upcoming fests'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default FestsPage;
