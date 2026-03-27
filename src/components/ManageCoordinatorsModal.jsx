import React, { useState, useEffect } from 'react';
import { getUsersByCollege, addCoordinatorToFest, removeCoordinatorFromFest } from '../firebase';
import { FaTimes, FaSearch, FaUserTie, FaUserGraduate, FaPlus, FaTrash, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

function ManageCoordinatorsModal({ fest, collegeId, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('faculty');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [coordinators, setCoordinators] = useState({
        faculty: fest.facultyCoordinators || [],
        student: fest.studentCoordinators || []
    });

    useEffect(() => {
        loadUsers();
    }, [activeTab, collegeId]);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const role = activeTab === 'faculty' ? 'faculty' : 'student';
            const usersList = await getUsersByCollege(collegeId, { role });
            setUsers(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
        }
        setLoading(false);
    };

    const filterUsers = () => {
        let filtered = [...users];

        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.displayName?.toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search)
            );
        }

        setFilteredUsers(filtered);
    };

    const handleAddCoordinator = async (userId) => {
        try {
            await addCoordinatorToFest(fest.id, userId, activeTab);
            setCoordinators(prev => ({
                ...prev,
                [activeTab]: [...prev[activeTab], userId]
            }));
            toast.success('Coordinator added successfully!');
        } catch (error) {
            console.error('Error adding coordinator:', error);
            toast.error('Failed to add coordinator');
        }
    };

    const handleRemoveCoordinator = async (userId) => {
        try {
            await removeCoordinatorFromFest(fest.id, userId, activeTab);
            setCoordinators(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].filter(id => id !== userId)
            }));
            toast.success('Coordinator removed successfully!');
        } catch (error) {
            console.error('Error removing coordinator:', error);
            toast.error('Failed to remove coordinator');
        }
    };

    const isCoordinator = (userId) => {
        return coordinators[activeTab].includes(userId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 rounded-2xl shadow-xl max-w-3xl w-full border border-slate-800 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Manage Coordinators</h2>
                            <p className="text-sm text-gray-400 mt-1">For {fest.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setActiveTab('faculty');
                                setSearchTerm('');
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === 'faculty'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            <FaUserTie className="inline mr-2" />
                            Faculty ({coordinators.faculty.length})
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('student');
                                setSearchTerm('');
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === 'student'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            <FaUserGraduate className="inline mr-2" />
                            Students ({coordinators.student.length})
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-slate-800">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'faculty' ? 'faculty' : 'students'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="space-y-2">
                            {filteredUsers.map((user) => {
                                const isAdded = isCoordinator(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            isAdded
                                                ? 'border-green-500 bg-green-500/10'
                                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.displayName}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                                                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-semibold text-white">{user.displayName}</p>
                                                <p className="text-sm text-gray-400">{user.email}</p>
                                                {user.branch && (
                                                    <p className="text-xs text-gray-500 mt-1">{user.branch}</p>
                                                )}
                                            </div>
                                            {isAdded ? (
                                                <>
                                                    <FaCheck className="text-green-400 mr-2" />
                                                    <button
                                                        onClick={() => handleRemoveCoordinator(user.id)}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                                                    >
                                                        <FaTrash className="inline mr-1" /> Remove
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddCoordinator(user.id)}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                                                >
                                                    <FaPlus className="inline mr-1" /> Add
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            {searchTerm ? 'No users found matching your search' : `No ${activeTab} members found`}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800">
                    <button
                        onClick={() => {
                            onSuccess();
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ManageCoordinatorsModal;
