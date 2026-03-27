import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } from '../firebase';
import logo from '../assets/logo.png';
import { FaUserCircle, FaSearch, FaBell, FaPlus, FaSignOutAlt, FaUser, FaCompass, FaCalendarAlt, FaReceipt, FaUsers, FaChalkboardTeacher, FaCog, FaTrophy } from 'react-icons/fa';
import { toast } from 'react-toastify';
import NotificationBell from './NotificationBell';
import NotificationSidebar from './NotificationSidebar';

function DashboardHeader({ onOpenCreateEvent }) {
    const { userData, collegeSettings, currentUser, notifications, unreadNotificationCount } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const dropdownRef = useRef(null);

    const canCreateEvent =
        userData?.role === 'club-lead' ||
        userData?.role === 'collegeAdmin' ||
        (userData?.role === 'student' && collegeSettings?.festMode === true);

    // Check if user is faculty, collegeAdmin, or admin (can access faculty dashboard)
    const isFacultyOrAdmin = ['faculty', 'collegeAdmin', 'admin'].includes(userData?.role);

    // Check if user is collegeAdmin
    const isCollegeAdmin = userData?.role === 'collegeAdmin';

    // Check if user is a student (show student-only sections)
    const isStudent = userData?.role === 'student' || userData?.role === 'club-lead';

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully!");
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out:", error);
            toast.error("Failed to log out.");
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const isActive = (path) => location.pathname === path;

    const navLinkClass = (path) =>
        `relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive(path)
                ? 'text-white bg-slate-800/80'
                : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
        }`;

    const NavIndicator = ({ active }) => (
        active && (
            <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-orange-500 rounded-full" />
        )
    );

    // Notification handlers
    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.read && currentUser?.uid) {
            await markNotificationRead(currentUser.uid, notification.id);
        }
        // Navigate to event if exists
        if (notification.eventId) {
            setIsNotificationOpen(false);
            navigate(`/event/${notification.eventId}`);
        }
    };

    const handleDismissNotification = async (notificationId) => {
        if (currentUser?.uid) {
            await deleteNotification(currentUser.uid, notificationId);
        }
    };

    const handleMarkAllRead = async () => {
        if (currentUser?.uid) {
            await markAllNotificationsRead(currentUser.uid);
        }
    };

    const handleClearAll = async () => {
        if (currentUser?.uid) {
            await clearAllNotifications(currentUser.uid);
        }
    };

    return (
        <>
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
            {/* Gradient accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />
            
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                            <img className="relative h-9 w-auto rounded-lg" src={logo} alt="Logo" />
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:block">College Connect</span>
                    </Link>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                            <span className="flex items-center gap-2">
                                <FaCalendarAlt className="text-xs" /> Dashboard
                            </span>
                            <NavIndicator active={isActive('/dashboard')} />
                        </Link>

                        <Link to="/browse" className={navLinkClass('/browse')}>
                            <span className="flex items-center gap-2">
                                <FaCompass className="text-xs" /> Browse
                            </span>
                            <NavIndicator active={isActive('/browse')} />
                        </Link>

                        <Link to="/clubs" className={navLinkClass('/clubs')}>
                            <span className="flex items-center gap-2">
                                <FaUsers className="text-xs" /> Clubs
                            </span>
                            <NavIndicator active={isActive('/clubs')} />
                        </Link>

                        <Link to="/fests" className={navLinkClass('/fests')}>
                            <span className="flex items-center gap-2">
                                <FaTrophy className="text-xs" /> Fests
                            </span>
                            <NavIndicator active={isActive('/fests')} />
                        </Link>

                        {isStudent && (
                            <>
                                <Link to="/my-events" className={navLinkClass('/my-events')}>
                                    <span className="flex items-center gap-2">
                                        My Events
                                    </span>
                                    <NavIndicator active={isActive('/my-events')} />
                                </Link>

                                <Link to="/activities" className={navLinkClass('/activities')}>
                                    <span className="flex items-center gap-2">
                                        <FaBell className="text-xs" /> Activity
                                    </span>
                                    <NavIndicator active={isActive('/activities')} />
                                </Link>
                            </>
                        )}

                        {isFacultyOrAdmin && (
                            <Link to="/faculty-dashboard" className={navLinkClass('/faculty-dashboard')}>
                                <span className="flex items-center gap-2">
                                    <FaChalkboardTeacher className="text-xs" /> Faculty
                                </span>
                                <NavIndicator active={isActive('/faculty-dashboard')} />
                            </Link>
                        )}

                        {isCollegeAdmin && (
                            <Link to="/college-admin" className={navLinkClass('/college-admin')}>
                                <span className="flex items-center gap-2">
                                    <FaCog className="text-xs" /> Admin
                                </span>
                                <NavIndicator active={isActive('/college-admin')} />
                            </Link>
                        )}

                        {canCreateEvent && (
                            <button
                                onClick={onOpenCreateEvent}
                                className="ml-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/25"
                            >
                                <FaPlus className="text-xs" /> Create
                            </button>
                        )}
                    </div>

                    {/* Right side: Notification Bell + Profile */}
                    <div className="flex items-center gap-2">
                        {/* Notification Bell */}
                        <NotificationBell 
                            unreadCount={unreadNotificationCount} 
                            onClick={() => setIsNotificationOpen(true)} 
                        />

                        {/* Profile */}
                        <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                        >
                            <span className="text-sm font-medium text-gray-300 hidden sm:block">
                                {userData?.displayName || 'User'}
                            </span>
                            {userData?.photoURL ? (
                                <img 
                                    src={userData.photoURL} 
                                    alt="Profile" 
                                    className="h-9 w-9 rounded-xl object-cover ring-2 ring-slate-700" 
                                />
                            ) : (
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                                    <FaUserCircle className="h-5 w-5 text-white" />
                                </div>
                            )}
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl py-2 bg-slate-800 border border-slate-700 z-50 animate-fade-in">
                                {/* User info */}
                                <div className="px-4 py-3 border-b border-slate-700">
                                    <p className="text-sm font-semibold text-white">{userData?.displayName}</p>
                                    <p className="text-xs text-gray-400 truncate">{userData?.email}</p>
                                </div>

                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <FaUser className="text-fuchsia-400" />
                                    Your Profile
                                </Link>

                                <Link
                                    to="/payments"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <FaReceipt className="text-emerald-400" />
                                    Payment History
                                </Link>

                                {isFacultyOrAdmin && (
                                    <Link
                                        to="/faculty-dashboard"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <FaChalkboardTeacher className="text-purple-400" />
                                        Faculty Dashboard
                                    </Link>
                                )}

                                {isCollegeAdmin && (
                                    <Link
                                        to="/college-admin"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <FaCog className="text-indigo-400" />
                                        College Admin
                                    </Link>
                                )}

                                {/* Mobile nav */}
                                <div className="md:hidden border-t border-slate-700 mt-1 pt-1">
                                    <Link
                                        to="/browse"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <FaCompass className="text-indigo-400" />
                                        Browse Events
                                    </Link>
                                    <Link
                                        to="/clubs"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <FaUsers className="text-purple-400" />
                                        Clubs
                                    </Link>
                                    <Link
                                        to="/fests"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <FaTrophy className="text-amber-400" />
                                        Fests
                                    </Link>
                                    {isStudent && (
                                        <Link
                                            to="/activities"
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <FaBell className="text-orange-400" />
                                            Activity
                                        </Link>
                                    )}
                                    {canCreateEvent && (
                                        <button
                                            onClick={() => { onOpenCreateEvent(); setIsDropdownOpen(false); }}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors w-full"
                                        >
                                            <FaPlus className="text-emerald-400" />
                                            Create Event
                                        </button>
                                    )}
                                </div>

                                <div className="border-t border-slate-700 mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors w-full"
                                    >
                                        <FaSignOutAlt />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>

        {/* Notification Sidebar */}
        <NotificationSidebar
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onDismiss={handleDismissNotification}
            onMarkAllRead={handleMarkAllRead}
            onClearAll={handleClearAll}
        />
        </>
    );
}

export default DashboardHeader;