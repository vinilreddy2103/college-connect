import React, { useState } from 'react';
import { FaHome, FaUsers, FaCalendarAlt, FaFlag, FaTrophy, FaBars, FaTimes } from 'react-icons/fa';

function AdminSidebarLayout({ children, activeTab, onTabChange }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'overview', label: 'Overview', icon: FaHome },
        { id: 'users', label: 'Users', icon: FaUsers },
        { id: 'events', label: 'Events', icon: FaCalendarAlt },
        { id: 'clubs', label: 'Clubs', icon: FaFlag },
        { id: 'fests', label: 'Fests', icon: FaTrophy },
    ];

    const handleNavClick = (tabId) => {
        onTabChange(tabId);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold gradient-text">College Admin</h1>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
                    >
                        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>
                </div>
            </div>

            <div className="flex pt-16 lg:pt-0">
                {/* Sidebar */}
                <aside
                    className={`fixed lg:sticky top-16 lg:top-0 left-0 h-[calc(100vh-4rem)] lg:h-screen w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out z-40 ${
                        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
                >
                    {/* Logo Section - Desktop */}
                    <div className="hidden lg:block p-6 border-b border-slate-800">
                        <h1 className="text-2xl font-bold gradient-text">College Admin</h1>
                        <p className="text-sm text-gray-400 mt-1">Management Dashboard</p>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                            : 'text-gray-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className={isActive ? 'text-white' : 'text-gray-500'} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer - Version */}
                    <div className="absolute bottom-4 left-4 right-4 p-4 bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-gray-500">College Connect</p>
                        <p className="text-xs text-gray-600">Admin Portal v1.0</p>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {isMobileMenuOpen && (
                    <div
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 min-h-screen p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default AdminSidebarLayout;
