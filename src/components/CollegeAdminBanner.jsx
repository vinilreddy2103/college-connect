import React from 'react';
import { Link } from 'react-router-dom';
import { FaCog, FaUsers, FaClock, FaTimes, FaArrowRight, FaCalendarCheck } from 'react-icons/fa';

function CollegeAdminBanner({ stats, onDismiss }) {
    const { totalUsers = 0, pendingEventsCount = 0, totalEvents = 0 } = stats || {};

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 via-slate-900/40 to-blue-900/40 border border-indigo-500/30 p-6 mb-6">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-blue-600/10" />
            
            {/* Dismiss button */}
            <button
                onClick={onDismiss}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800/50 text-gray-400 hover:text-white transition-colors z-10"
                aria-label="Dismiss"
            >
                <FaTimes />
            </button>

            <div className="relative z-10">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg">
                            <FaCog className="text-2xl text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">College Admin Portal</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Admin Access
                            </span>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4">
                            Manage your college's events, users, clubs, and settings from the admin dashboard.
                        </p>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <FaUsers className="text-blue-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Total Users</p>
                                    <p className="text-lg font-bold text-white">{totalUsers}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <FaCalendarCheck className="text-emerald-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Total Events</p>
                                    <p className="text-lg font-bold text-white">{totalEvents}</p>
                                </div>
                            </div>

                            {pendingEventsCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                    <FaClock className="text-orange-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">Pending Approval</p>
                                        <p className="text-lg font-bold text-orange-300">{pendingEventsCount}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA Button */}
                        <Link
                            to="/college-admin"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
                        >
                            Go to Admin Dashboard
                            <FaArrowRight className="text-sm" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CollegeAdminBanner;
