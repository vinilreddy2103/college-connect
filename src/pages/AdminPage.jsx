import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { 
    FaSignOutAlt, FaUniversity, FaChartBar, FaUserShield, 
    FaHistory, FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

// Import tab components
import AnalyticsTab from '../components/AnalyticsTab';
import CollegesTab from '../components/CollegesTab';
import AdminsTab from '../components/AdminsTab';
import AuditLogsTab from '../components/AuditLogsTab';

function AdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin/login');
        } catch (err) {
            console.error("Logout Error:", err);
            toast.error("Failed to log out");
        }
    };

    const tabs = [
        { id: 'analytics', label: 'Analytics', icon: FaChartBar },
        { id: 'colleges', label: 'Colleges', icon: FaUniversity },
        { id: 'admins', label: 'Admins', icon: FaUserShield },
        { id: 'logs', label: 'Audit Logs', icon: FaHistory },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            
            {/* Header */}
            <nav className="bg-slate-800 border-b border-slate-700 px-4 sm:px-8 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Logo" className="w-10 h-10" />
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Super Admin
                            </h1>
                            <p className="text-xs text-gray-400">Platform Management</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl transition-all text-sm font-semibold border border-red-500/30"
                    >
                        <FaSignOutAlt />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Tab Navigation */}
            <div className="bg-slate-800/50 border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? 'text-purple-400 border-purple-400'
                                        : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
                                }`}
                            >
                                <tab.icon />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                {activeTab === 'analytics' && <AnalyticsTab />}
                {activeTab === 'colleges' && <CollegesTab />}
                {activeTab === 'admins' && <AdminsTab />}
                {activeTab === 'logs' && <AuditLogsTab />}
            </div>
        </div>
    );
}

export default AdminPage;