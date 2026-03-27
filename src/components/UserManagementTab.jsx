import React, { useState, useEffect } from 'react';
import { getUsersByCollege, assignUserRole } from '../firebase';
import { FaSearch, FaFilter, FaUserEdit, FaEye, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

function UserManagementTab({ collegeId }) {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [collegeId]);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersList = await getUsersByCollege(collegeId);
            setUsers(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
        }
        setLoading(false);
    };

    const filterUsers = () => {
        let filtered = [...users];

        // Filter by role
        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.displayName?.toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search) ||
                u.rollNumber?.toLowerCase().includes(search)
            );
        }

        setFilteredUsers(filtered);
    };

    const handleAssignRole = (user) => {
        setSelectedUser(user);
        setShowAssignRoleModal(true);
    };

    const getRoleBadge = (role) => {
        const badges = {
            student: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Student' },
            faculty: { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Faculty' },
            'club-lead': { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Club Lead' },
            collegeAdmin: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Admin' },
        };

        const badge = badges[role] || badges.student;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="card p-8">
                <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                <p className="text-gray-400">Manage users and assign roles</p>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or roll number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative">
                        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="pl-12 pr-8 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="student">Students</option>
                            <option value="faculty">Faculty</option>
                            <option value="club-lead">Club Leads</option>
                            <option value="collegeAdmin">Admins</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex gap-4 text-sm">
                    <span className="text-gray-400">
                        Total: <span className="text-white font-semibold">{users.length}</span>
                    </span>
                    <span className="text-gray-400">
                        Showing: <span className="text-white font-semibold">{filteredUsers.length}</span>
                    </span>
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Branch
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {user.photoURL ? (
                                                    <img
                                                        src={user.photoURL}
                                                        alt={user.displayName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                        {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {user.displayName || 'No Name'}
                                                    </p>
                                                    {user.rollNumber && (
                                                        <p className="text-xs text-gray-500">{user.rollNumber}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-300">{user.email}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-400">{user.branch || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAssignRole(user)}
                                                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-400 hover:text-indigo-300 transition-colors"
                                                    title="Assign Role"
                                                >
                                                    <FaUserEdit />
                                                </button>
                                                <button
                                                    onClick={() => toast.info('View details - Coming soon')}
                                                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-gray-300 transition-colors"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        No users found matching your criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Role Modal */}
            {showAssignRoleModal && selectedUser && (
                <AssignRoleModal
                    user={selectedUser}
                    onClose={() => {
                        setShowAssignRoleModal(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        loadUsers();
                        setShowAssignRoleModal(false);
                        setSelectedUser(null);
                    }}
                    collegeId={collegeId}
                />
            )}
        </div>
    );
}

// Assign Role Modal Component
function AssignRoleModal({ user, onClose, onSuccess, collegeId }) {
    const [selectedRole, setSelectedRole] = useState(user.role);
    const [loading, setLoading] = useState(false);

    const roles = [
        { value: 'student', label: 'Student', description: 'Regular student with basic access' },
        { value: 'faculty', label: 'Faculty', description: 'Can manage clubs and approve events' },
        { value: 'club-lead', label: 'Club Lead', description: 'Can create and manage club events' },
    ];

    const handleAssign = async () => {
        if (selectedRole === user.role) {
            toast.info('User already has this role');
            return;
        }

        setLoading(true);
        try {
            await assignUserRole(user.id, selectedRole, collegeId);
            toast.success(`Role updated to ${selectedRole} successfully!`);
            onSuccess();
        } catch (error) {
            console.error('Error assigning role:', error);
            toast.error('Failed to assign role');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-800">
                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white">Assign Role</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Change role for {user.displayName}
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {roles.map((role) => (
                        <button
                            key={role.value}
                            onClick={() => setSelectedRole(role.value)}
                            className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                                selectedRole === role.value
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white">{role.label}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                                </div>
                                {selectedRole === role.value && (
                                    <FaCheckCircle className="text-indigo-400 text-xl" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || selectedRole === user.role}
                        className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Assigning...' : 'Assign Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserManagementTab;
