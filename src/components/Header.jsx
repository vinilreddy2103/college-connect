import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; // Import your logo

function Header() {
    return (
        <header className="absolute top-0 left-0 w-full z-10 bg-transparent">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center space-x-2">
                            <img className="h-10 w-auto" src={logo} alt="College Connect Logo" />
                            <span className="text-white text-xl font-bold">College Connect</span>
                        </Link>
                    </div>
                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;