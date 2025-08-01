
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
    const { currentUser, userData } = useAuth();

    // If user is not logged in, or their role is not 'webAppAdmin', redirect them.
    if (!currentUser || userData?.role !== 'webAppAdmin') {
        return <Navigate to="/" />;
    }

    // If they are an admin, render the page.
    return children;
}

export default AdminRoute;