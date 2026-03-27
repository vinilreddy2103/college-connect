import React, { useState, useEffect } from 'react';
import { getClubsByCollege, updateClubStatus, assignFacultyToClub, getUsersByCollege } from '../firebase';
import { FaSearch, FaFilter, FaUserTie, FaCheck, FaTimes, FaEye, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function ClubManagementTab({ collegeId }) {
    const navigate = useNavigate();
    const [clubs, setClubs] = useState([]);
    const [filteredClubs, setFilteredClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAssignFacultyModal, setShowAssignFacultyModal] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);

    useEffect(() => {
        loadClubs();
    }, [collegeId]);

    useEffect(() => {
        filterClubs();
    }, [clubs, searchTerm, categoryFilter, statusFilter]);

    const loadClubs = async () => {
        setLoading(true);
        try {
            const clubsList = await getClubsByCollege(collegeId);
            setClubs(clubsList);
        } catch (error) {
            console.error('Error loading clubs:', error);
            toast.error('Failed to load clubs');
        }
        setLoading(false);
    };

    const filterClubs = () => {
        let filtered = [...clubs];

        // Filter by category
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(c => c.category === categoryFilter);
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => (c.status || 'active') === statusFilter);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.name?.toLowerCase().includes(search) ||
                c.description?.toLowerCase().includes(search)
            );
        }

        setFilteredClubs(filtered);
    };

    const handleStatusChange = async (clubId, newStatus) => {
        try {
            await updateClubStatus(clubId, newStatus);
            toast.success(`Club ${newStatus} successfully!`);
            loadClubs();
        } catch (error) {
            console.error('Error updating club status:', error);
            toast.error('Failed to update club status');
        }
    };

    const handleAssignFaculty = (club) => {
        setSelectedClub(club);
        setShowAssignFacultyModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Active' },
            pending: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Pending' },
            inactive: { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: 'Inactive' },
        };

        const badge = badges[status] || badges.active;
        
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const getCategoryBadge = (category) => {
        const badges = {
            technical: { color: 'bg-blue-500/20 text-blue-300', label: 'Technical' },
            cultural: { color: 'bg-purple-500/20 text-purple-300', label: 'Cultural' },
            sports: { color: 'bg-emerald-500/20 text-emerald-300', label: 'Sports' },
            social: { color: 'bg-pink-500/20 text-pink-300', label: 'Social' },
            literary: { color: 'bg-yellow-500/20 text-yellow-300', label: 'Literary' },
        };

        const badge = badges[category] || { color: 'bg-gray-500/20 text-gray-300', label: category };
        
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
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
                <h1 className="text-3xl font-bold text-white mb-2">Club Management</h1>
                <p className="text-gray-400">Oversee and manage college clubs</p>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search clubs by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="pl-12 pr-8 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            <option value="technical">Technical</option>
                            <option value="cultural">Cultural</option>
                            <option value="sports">Sports</option>
                            <option value="social">Social</option>
                            <option value="literary">Literary</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex gap-4 text-sm">
                    <span className="text-gray-400">
                        Total: <span className="text-white font-semibold">{clubs.length}</span>
                    </span>
                    <span className="text-gray-400">
                        Showing: <span className="text-white font-semibold">{filteredClubs.length}</span>
                    </span>
                </div>
            </div>

            {/* Clubs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredClubs.length > 0 ? (
                    filteredClubs.map((club) => (
                        <div key={club.id} className="card p-6 hover:border-indigo-500/50 transition-colors">
                            {/* Club Header */}
                            <div className="flex items-start gap-4 mb-4">
                                {club.logoURL && (
                                    <img
                                        src={club.logoURL}
                                        alt={club.name}
                                        className="w-16 h-16 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{club.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getCategoryBadge(club.category)}
                                                {getStatusBadge(club.status || 'active')}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-2">{club.description}</p>
                                </div>
                            </div>

                            {/* Club Stats */}
                            <div className="flex gap-4 text-sm text-gray-400 mb-4 py-3 border-y border-slate-800">
                                <span>👥 {club.memberCount || 0} members</span>
                                {club.isPaid && <span>💰 ₹{club.membershipFee}</span>}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                {(club.status === 'pending' || !club.status) && (
                                    <>
                                        <button
                                            onClick={() => handleStatusChange(club.id, 'active')}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
                                        >
                                            <FaCheck className="inline mr-1" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(club.id, 'inactive')}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                                        >
                                            <FaTimes className="inline mr-1" /> Reject
                                        </button>
                                    </>
                                )}
                                
                                {club.status === 'active' && (
                                    <button
                                        onClick={() => handleStatusChange(club.id, 'inactive')}
                                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                                    >
                                        <FaToggleOff className="inline mr-1" /> Deactivate
                                    </button>
                                )}

                                {club.status === 'inactive' && (
                                    <button
                                        onClick={() => handleStatusChange(club.id, 'active')}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
                                    >
                                        <FaToggleOn className="inline mr-1" /> Activate
                                    </button>
                                )}

                                <button
                                    onClick={() => handleAssignFaculty(club)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                                >
                                    <FaUserTie className="inline mr-1" /> Assign Faculty
                                </button>
                                <button
                                    onClick={() => navigate(`/club/${club.id}`)}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                                >
                                    <FaEye className="inline mr-1" /> View
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 card p-12 text-center text-gray-400">
                        No clubs found matching your criteria
                    </div>
                )}
            </div>

            {/* Assign Faculty Modal */}
            {showAssignFacultyModal && selectedClub && (
                <AssignFacultyModal
                    club={selectedClub}
                    collegeId={collegeId}
                    onClose={() => {
                        setShowAssignFacultyModal(false);
                        setSelectedClub(null);
                    }}
                    onSuccess={() => {
                        loadClubs();
                        setShowAssignFacultyModal(false);
                        setSelectedClub(null);
                    }}
                />
            )}
        </div>
    );
}

// Assign Faculty Modal Component
function AssignFacultyModal({ club, collegeId, onClose, onSuccess }) {
    const [faculty, setFaculty] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(club.facultyCoordinatorId || null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadFaculty();
    }, [collegeId]);

    const loadFaculty = async () => {
        try {
            const users = await getUsersByCollege(collegeId, { role: 'faculty' });
            setFaculty(users);
        } catch (error) {
            console.error('Error loading faculty:', error);
            toast.error('Failed to load faculty list');
        }
        setLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedFaculty) {
            toast.warning('Please select a faculty member');
            return;
        }

        setSubmitting(true);
        try {
            await assignFacultyToClub(club.id, selectedFaculty);
            toast.success('Faculty coordinator assigned successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error assigning faculty:', error);
            toast.error('Failed to assign faculty');
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-800 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900">
                    <h2 className="text-2xl font-bold text-white">Assign Faculty Coordinator</h2>
                    <p className="text-sm text-gray-400 mt-1">For {club.name}</p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                        </div>
                    ) : faculty.length > 0 ? (
                        <div className="space-y-2">
                            {faculty.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedFaculty(f.id)}
                                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                                        selectedFaculty === f.id
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {f.photoURL ? (
                                            <img
                                                src={f.photoURL}
                                                alt={f.displayName}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                                {f.displayName?.charAt(0)?.toUpperCase() || 'F'}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{f.displayName}</p>
                                            <p className="text-sm text-gray-400">{f.email}</p>
                                        </div>
                                        {selectedFaculty === f.id && (
                                            <FaCheck className="text-indigo-400" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 py-8">No faculty members found</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex gap-3 sticky bottom-0 bg-slate-900">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={submitting || !selectedFaculty}
                        className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Assigning...' : 'Assign Faculty'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ClubManagementTab;
