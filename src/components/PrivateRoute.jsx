import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children }) {
    const { currentUser, loading } = useAuth();

    // 1. While Firebase is checking if the user is logged in, show a loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl animate-pulse">Loading access...</div>
            </div>
        );
    }

    // 2. If the check finishes and there is NO user, redirect to Login
    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // 3. If the user is logged in, allow them to access the 'children' (the protected page)
    return children;
}

export default PrivateRoute;