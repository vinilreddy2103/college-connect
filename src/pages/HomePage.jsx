import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../firebase';
import { useAuth } from '../context/AuthContext';

function HomePage() {
    const navigate = useNavigate();
    const { userData } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login'); // Redirect to login after logout
        } catch (error) {
            console.error("Failed to log out from HomePage:", error);
        }
    };

    // The protection logic is now removed from here.
    // If we reach this point, we know the user is logged in.
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg w-full max-w-lg">
                <h1 className="text-4xl font-bold text-sky-400">Welcome to College Connect</h1>

                {userData?.photoURL && (
                    <img
                        src={userData.photoURL}
                        alt="Profile"
                        className="w-24 h-24 rounded-full mx-auto mt-6 border-4 border-sky-500"
                    />
                )}

                <p className="mt-4 text-xl text-gray-300">
                    {userData?.displayName || 'User'}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                    {userData?.email}
                </p>
                <p className="mt-1 text-xs text-yellow-400 uppercase font-semibold">
                    {userData?.role}
                </p>

                <button
                    onClick={handleLogout}
                    className="mt-8 px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-colors duration-200"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default HomePage;
