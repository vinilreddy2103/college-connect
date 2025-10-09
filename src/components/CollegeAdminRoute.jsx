import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function CollegeAdminRoute({ children }) {
    const { currentUser, userData } = useAuth();

    // If user is not logged in, or their role is not 'collegeAdmin', redirect them.
    if (!currentUser || userData?.role !== 'collegeAdmin') {
        return <Navigate to="/dashboard" />;
    }

    // If they are a college admin, render the page.
    return children;
}

export default CollegeAdminRoute;