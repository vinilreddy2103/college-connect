import React, { useState, useEffect } from 'react';
import { getPlatformStats, getRecentActivity } from '../firebase';
import { 
    FaUsers, FaCalendarAlt, FaUniversity, FaBuilding, 
    FaChartLine, FaUserPlus, FaCalendarPlus, FaSpinner
} from 'react-icons/fa';

function AnalyticsTab() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, activityData] = await Promise.all([
                getPlatformStats(),
                getRecentActivity(10)
            ]);
            setStats(statsData);
            setActivity(activityData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-300 text-sm font-medium">Total Users</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <FaUsers className="text-2xl text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Total Events */}
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-300 text-sm font-medium">Total Events</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats?.totalEvents || 0}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {stats?.approvedEvents || 0} approved • {stats?.pendingEvents || 0} pending
                            </p>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <FaCalendarAlt className="text-2xl text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Active Colleges */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl p-6 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-300 text-sm font-medium">Active Colleges</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats?.activeColleges || 0}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                of {stats?.totalColleges || 0} total
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <FaUniversity className="text-2xl text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* Active Clubs */}
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl p-6 border border-orange-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-300 text-sm font-medium">Active Clubs</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats?.activeClubs || 0}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                of {stats?.totalClubs || 0} total
                            </p>
                        </div>
                        <div className="p-3 bg-orange-500/20 rounded-xl">
                            <FaBuilding className="text-2xl text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <FaChartLine className="text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                </div>

                {activity.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No recent activity</p>
                ) : (
                    <div className="space-y-4">
                        {activity.map((item, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl"
                            >
                                <div className={`p-2 rounded-lg ${
                                    item.type === 'user_signup' 
                                        ? 'bg-blue-500/20' 
                                        : 'bg-purple-500/20'
                                }`}>
                                    {item.type === 'user_signup' ? (
                                        <FaUserPlus className="text-blue-400" />
                                    ) : (
                                        <FaCalendarPlus className="text-purple-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm truncate">{item.message}</p>
                                </div>
                                <span className="text-gray-500 text-xs whitespace-nowrap">
                                    {formatTimeAgo(item.timestamp)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnalyticsTab;
