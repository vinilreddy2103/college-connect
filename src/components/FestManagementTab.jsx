import React, { useState, useEffect } from 'react';
import { getFestsByCollege, deleteFest, uploadImage } from '../firebase';
import { FaPlus, FaSearch, FaCalendarAlt, FaEdit, FaTrash, FaUserTie, FaTrophy, FaGlobe, FaBuilding } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import CreateFestModal from './CreateFestModal';
import ManageCoordinatorsModal from './ManageCoordinatorsModal';

function FestManagementTab({ collegeId }) {
    const { userData } = useAuth();
    const [fests, setFests] = useState([]);
    const [filteredFests, setFilteredFests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCoordinatorsModal, setShowCoordinatorsModal] = useState(false);
    const [selectedFest, setSelectedFest] = useState(null);

    useEffect(() => {
        loadFests();
    }, [collegeId]);

    useEffect(() => {
        filterFests();
    }, [fests, searchTerm]);

    const loadFests = async () => {
        setLoading(true);
        try {
            const festsList = await getFestsByCollege(collegeId);
            setFests(festsList);
        } catch (error) {
            console.error('Error loading fests:', error);
            toast.error('Failed to load fests');
        }
        setLoading(false);
    };

    const filterFests = () => {
        let filtered = [...fests];

        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(f =>
                f.name?.toLowerCase().includes(search) ||
                f.scope?.toLowerCase().includes(search)
            );
        }

        setFilteredFests(filtered);
    };

    const handleDelete = async (festId, festName) => {
        if (!window.confirm(`Are you sure you want to delete "${festName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteFest(festId);
            toast.success('Fest deleted successfully!');
            loadFests();
        } catch (error) {
            console.error('Error deleting fest:', error);
            toast.error('Failed to delete fest');
        }
    };

    const handleEdit = (fest) => {
        setSelectedFest(fest);
        setShowEditModal(true);
    };

    const handleManageCoordinators = (fest) => {
        setSelectedFest(fest);
        setShowCoordinatorsModal(true);
    };

    const getStatusBadge = (fest) => {
        const now = new Date();
        const start = fest.startDate;
        const end = fest.endDate;

        let status, color;
        if (now < start) {
            status = 'Upcoming';
            color = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        } else if (now >= start && now <= end) {
            status = 'Ongoing';
            color = 'bg-green-500/20 text-green-300 border-green-500/30';
        } else {
            status = 'Completed';
            color = 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
                {status}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Fest Management</h1>
                    <p className="text-gray-400">Create and manage college fests</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2"
                >
                    <FaPlus /> Create Fest
                </button>
            </div>

            {/* Search Bar */}
            <div className="card p-6">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search fests by name or scope..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <div className="mt-4 text-sm text-gray-400">
                    Total: <span className="text-white font-semibold">{fests.length}</span> | 
                    Showing: <span className="text-white font-semibold">{filteredFests.length}</span>
                </div>
            </div>

            {/* Fests Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredFests.length > 0 ? (
                    filteredFests.map((fest) => (
                        <div key={fest.id} className="card p-6 hover:border-indigo-500/50 transition-colors">
                            {/* Fest Header */}
                            <div className="flex items-start gap-4 mb-4">
                                {fest.logoURL && (
                                    <img
                                        src={fest.logoURL}
                                        alt={fest.name}
                                        className="w-20 h-20 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <FaTrophy className="text-yellow-400" />
                                                {fest.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                {getStatusBadge(fest)}
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    fest.scope === 'college' 
                                                        ? 'bg-purple-500/20 text-purple-300' 
                                                        : 'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {fest.scope === 'college' ? (
                                                        <><FaBuilding className="inline mr-1" />College-wide</>
                                                    ) : (
                                                        <><FaBuilding className="inline mr-1" />{fest.branchName}</>
                                                    )}
                                                </span>
                                                {fest.allowOtherColleges && (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300">
                                                        <FaGlobe className="inline mr-1" />Open to All
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fest Dates */}
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 pb-4 border-b border-slate-800">
                                <FaCalendarAlt className="text-indigo-400" />
                                <span>{formatDate(fest.startDate)} - {formatDate(fest.endDate)}</span>
                            </div>

                            {/* Coordinators Info */}
                            <div className="flex gap-4 text-sm text-gray-400 mb-4">
                                <span>
                                    👨‍🏫 {fest.facultyCoordinators?.length || 0} Faculty
                                </span>
                                <span>
                                    👨‍🎓 {fest.studentCoordinators?.length || 0} Students
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleManageCoordinators(fest)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                                >
                                    <FaUserTie className="inline mr-1" /> Coordinators
                                </button>
                                <button
                                    onClick={() => handleEdit(fest)}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                                >
                                    <FaEdit className="inline mr-1" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(fest.id, fest.name)}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                                >
                                    <FaTrash className="inline mr-1" /> Delete
                                </button>
                            </div>

                            {/* Poster Preview */}
                            {fest.posterURL && (
                                <div className="mt-4">
                                    <img
                                        src={fest.posterURL}
                                        alt={`${fest.name} poster`}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 card p-12 text-center">
                        <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-4">
                            {searchTerm ? 'No fests found matching your search' : 'No fests created yet'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
                            >
                                <FaPlus className="inline mr-2" /> Create Your First Fest
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateFestModal
                    collegeId={collegeId}
                    collegeName={userData?.collegeName}
                    createdBy={userData?.uid}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        loadFests();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {showEditModal && selectedFest && (
                <CreateFestModal
                    collegeId={collegeId}
                    collegeName={userData?.collegeName}
                    createdBy={userData?.uid}
                    editMode={true}
                    festData={selectedFest}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedFest(null);
                    }}
                    onSuccess={() => {
                        loadFests();
                        setShowEditModal(false);
                        setSelectedFest(null);
                    }}
                />
            )}

            {showCoordinatorsModal && selectedFest && (
                <ManageCoordinatorsModal
                    fest={selectedFest}
                    collegeId={collegeId}
                    onClose={() => {
                        setShowCoordinatorsModal(false);
                        setSelectedFest(null);
                    }}
                    onSuccess={() => {
                        loadFests();
                        setShowCoordinatorsModal(false);
                        setSelectedFest(null);
                    }}
                />
            )}
        </div>
    );
}

export default FestManagementTab;
