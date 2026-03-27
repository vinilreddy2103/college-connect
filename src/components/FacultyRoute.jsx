import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function FacultyRoute({ children }) {
    const { currentUser, userData, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Allow faculty, collegeAdmin, and admin roles
    const allowedRoles = ['faculty', 'collegeAdmin', 'admin'];
    if (!userData || !allowedRoles.includes(userData.role)) {
        return <Navigate to="/dashboard" />;
    }

    return children;
}

export default FacultyRoute;
