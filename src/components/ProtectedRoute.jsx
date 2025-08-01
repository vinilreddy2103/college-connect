import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();

    // If there is no logged-in user, redirect to the login page.
    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // If the user is logged in, render the requested page.
    return children;
}

export default ProtectedRoute;
