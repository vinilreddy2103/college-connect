import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, getUsersByCollege, getApprovedEventsByCollege, getPendingEventsByCollege, getClubsByCollege } from '../firebase';
import { toast } from 'react-toastify';
import AdminSidebarLayout from '../components/AdminSidebarLayout';
import DashboardHeader from '../components/DashboardHeader';
import UserManagementTab from '../components/UserManagementTab';
import EventManagementTab from '../components/EventManagementTab';
import ClubManagementTab from '../components/ClubManagementTab';
import FestManagementTab from '../components/FestManagementTab';
import { FaToggleOn, FaToggleOff, FaChartBar, FaUsers, FaCalendarCheck, FaFlag } from 'react-icons/fa';

function CollegeAdminPage() {
    const { userData } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [isFestMode, setIsFestMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Set up a real-time listener for the college's settings
    useEffect(() => {
        if (!userData?.collegeId) return;

        const collegeRef = doc(db, 'colleges', userData.collegeId);
        const unsubscribe = onSnapshot(collegeRef, (docSnap) => {
            if (docSnap.exists()) {
                const collegeData = docSnap.data();
                setIsFestMode(collegeData.festMode || false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.collegeId]);

    const handleToggleFestMode = async () => {
        if (!userData?.collegeId) return;
        const collegeRef = doc(db, 'colleges', userData.collegeId);
        try {
            await updateDoc(collegeRef, {
                festMode: !isFestMode
            });
            toast.success(`Fest Mode ${!isFestMode ? 'activated' : 'deactivated'}!`);
        } catch (error) {
            toast.error("Failed to update setting. Please try again.");
            console.error("Error toggling Fest Mode:", error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab userData={userData} setActiveTab={setActiveTab} />;
            case 'users':
                return <UserManagementTab collegeId={userData?.collegeId} />;
            case 'events':
                return <EventManagementTab collegeId={userData?.collegeId} />;
            case 'clubs':
                return <ClubManagementTab collegeId={userData?.collegeId} />;
            case 'fests':
                return <FestManagementTab collegeId={userData?.collegeId} />;
            default:
                return <OverviewTab userData={userData} setActiveTab={setActiveTab} />;
        }
    };

    return (
        <>
            <DashboardHeader />
            <AdminSidebarLayout activeTab={activeTab} onTabChange={setActiveTab}>
                {renderContent()}
            </AdminSidebarLayout>
        </>
    );
}

// Overview Tab Component
function OverviewTab({ userData, setActiveTab }) {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvents: 0,
        activeClubs: 0,
        pendingApprovals: 0,
        loading: true
    });

    useEffect(() => {
        loadStats();
    }, [userData?.collegeId]);

    const loadStats = async () => {
        if (!userData?.collegeId) return;
        
        try {
            // Fetch all data in parallel
            const [users, approvedEvents, pendingEvents, clubs] = await Promise.all([
                getUsersByCollege(userData.collegeId),
                getApprovedEventsByCollege(userData.collegeId),
                getPendingEventsByCollege(userData.collegeId),
                getClubsByCollege(userData.collegeId)
            ]);

            // Calculate stats
            const activeClubs = clubs.filter(c => (c.status || 'active') === 'active').length;
            
            setStats({
                totalUsers: users.length,
                totalEvents: approvedEvents.length + pendingEvents.length,
                activeClubs: activeClubs,
                pendingApprovals: pendingEvents.length,
                loading: false
            });
        } catch (error) {
            console.error('Error loading stats:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    if (stats.loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back, <span className="gradient-text">{userData?.displayName}</span>
                    </h1>
                    <p className="text-gray-400">
                        Manage your college: {userData?.collegeName}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="h-12 bg-slate-700 rounded mb-2"></div>
                            <div className="h-8 bg-slate-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, <span className="gradient-text">{userData?.displayName}</span>
                </h1>
                <p className="text-gray-400">
                    Manage your college: {userData?.collegeName}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    icon={FaUsers}
                    title="Total Users"
                    value={stats.totalUsers.toString()}
                    color="blue"
                    trend={`${stats.totalUsers} registered`}
                />
                <StatsCard
                    icon={FaCalendarCheck}
                    title="Total Events"
                    value={stats.totalEvents.toString()}
                    color="purple"
                    trend={`${stats.totalEvents} in system`}
                />
                <StatsCard
                    icon={FaFlag}
                    title="Active Clubs"
                    value={stats.activeClubs.toString()}
                    color="green"
                    trend={`${stats.activeClubs} operational`}
                />
                <StatsCard
                    icon={FaChartBar}
                    title="Pending Approvals"
                    value={stats.pendingApprovals.toString()}
                    color="orange"
                    trend={stats.pendingApprovals > 0 ? "Needs attention" : "All cleared"}
                />
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700"
                    >
                        <FaUsers className="text-2xl text-blue-400 mb-2" />
                        <h3 className="font-semibold text-white mb-1">Manage Users</h3>
                        <p className="text-sm text-gray-400">View and assign roles</p>
                    </button>
                    <button 
                        onClick={() => setActiveTab('events')}
                        className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700"
                    >
                        <FaCalendarCheck className="text-2xl text-purple-400 mb-2" />
                        <h3 className="font-semibold text-white mb-1">Manage Events</h3>
                        <p className="text-sm text-gray-400">Approve and edit events</p>
                    </button>
                    <button 
                        onClick={() => setActiveTab('clubs')}
                        className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700"
                    >
                        <FaFlag className="text-2xl text-green-400 mb-2" />
                        <h3 className="font-semibold text-white mb-1">Manage Clubs</h3>
                        <p className="text-sm text-gray-400">Oversee club activities</p>
                    </button>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <p className="text-gray-400 text-center py-8">No recent activity to display</p>
            </div>
        </div>
    );
}

// Settings Tab Component
function SettingsTab({ userData, isFestMode, onToggleFestMode, loading }) {
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
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400">Configure your college settings</p>
            </div>

            {/* Settings Card */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                    Settings for {userData?.collegeName}
                </h2>

                {/* Fest Mode Setting */}
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {isFestMode ? (
                                <FaToggleOn className="text-3xl text-green-400" />
                            ) : (
                                <FaToggleOff className="text-3xl text-gray-600" />
                            )}
                            <h3 className="text-lg font-semibold text-white">Fest Mode</h3>
                        </div>
                        <p className="text-sm text-gray-400 ml-12">
                            Allow students to create events during your college's festival period.
                        </p>
                    </div>
                    <button
                        onClick={onToggleFestMode}
                        className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                            isFestMode
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                        }`}
                    >
                        {isFestMode ? 'Deactivate' : 'Activate'}
                    </button>
                </div>

                {/* More settings coming soon */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <p className="text-sm text-gray-400 text-center">
                        More settings coming soon...
                    </p>
                </div>
            </div>
        </div>
    );
}

// Stats Card Component
function StatsCard({ icon: Icon, title, value, color, trend }) {
    const colorClasses = {
        blue: 'from-blue-500 to-indigo-500',
        purple: 'from-purple-500 to-fuchsia-500',
        green: 'from-emerald-500 to-green-500',
        orange: 'from-orange-500 to-red-500',
    };

    return (
        <div className="card p-6 relative overflow-hidden">
            {/* Background Gradient */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full blur-2xl`} />
            
            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <Icon className={`text-3xl bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`} />
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
                <p className="text-3xl font-bold text-white mb-2">{value}</p>
                <p className="text-xs text-gray-500">{trend}</p>
            </div>
        </div>
    );
}

export default CollegeAdminPage;