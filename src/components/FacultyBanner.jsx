import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher, FaUsers, FaClock, FaTimes, FaArrowRight } from 'react-icons/fa';

function FacultyBanner({ stats, onDismiss }) {
    const { clubsCount = 0, pendingRequestsCount = 0 } = stats || {};

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 via-slate-900/40 to-indigo-900/40 border border-purple-500/30 p-6 mb-6">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10" />
            
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                            <FaChalkboardTeacher className="text-2xl text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">Faculty Dashboard</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Faculty Access
                            </span>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4">
                            Manage your clubs, review membership requests, and track event performance.
                        </p>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <FaUsers className="text-indigo-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Clubs Managed</p>
                                    <p className="text-lg font-bold text-white">{clubsCount}</p>
                                </div>
                            </div>

                            {pendingRequestsCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                    <FaClock className="text-orange-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">Pending Requests</p>
                                        <p className="text-lg font-bold text-orange-300">{pendingRequestsCount}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA Button */}
                        <Link
                            to="/faculty-dashboard"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25"
                        >
                            Go to Faculty Dashboard
                            <FaArrowRight className="text-sm" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FacultyBanner;
