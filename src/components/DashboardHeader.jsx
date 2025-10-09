import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase';
import logo from '../assets/logo.png';
import { FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

function DashboardHeader({ onOpenCreateEvent }) {
    const { userData, collegeSettings } = useAuth(); // Get collegeSettings from context
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Dynamic check for event creation permission
    const canCreateEvent =
        userData?.role === 'club-lead' ||
        userData?.role === 'collegeAdmin' ||
        (userData?.role === 'student' && collegeSettings?.festMode === true);

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


    return (
        <header className="bg-slate-800 shadow-md">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and App Name */}
                    <div className="flex-shrink-0">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <img className="h-8 w-auto" src={logo} alt="College Connect Logo" />
                            <span className="text-white text-xl font-bold">College Connect</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/dashboard" className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                            <Link to="/events" className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Events</Link>

                            {canCreateEvent && (
                                <button
                                    onClick={onOpenCreateEvent}
                                    className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Create Event
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center space-x-3 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                        >
                            <span className="text-white text-sm font-medium hidden sm:block">{userData?.displayName || 'User'}</span>
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="Profile" className="h-8 w-8 rounded-full" />
                            ) : (
                                <FaUserCircle className="h-8 w-8 text-slate-500" />
                            )}
                        </button>

                        {isDropdownOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-20">
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    Your Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default DashboardHeader;