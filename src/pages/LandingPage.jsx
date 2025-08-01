import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header'; // Import the header

function LandingPage() {
    return (
        <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden">
            <Header />
            {/* Hero Section */}
            <main className="flex items-center justify-center min-h-screen">
                <div className="text-center z-10 p-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        The Hub for Your <span className="text-sky-400">Campus Life</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
                        Discover events, join clubs, and connect with your college community like never before. All in one place.
                    </p>
                    <div className="mt-8 flex justify-center space-x-4">
                        <Link
                            to="/signup"
                            className="px-8 py-3 text-lg font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-transform transform hover:scale-105"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-3 text-lg font-semibold text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105"
                        >
                            Login
                        </Link>
                    </div>
                </div>
                {/* Background decorative gradient */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-sky-900/30 opacity-50"></div>
            </main>
        </div>
    );
}

export default LandingPage;