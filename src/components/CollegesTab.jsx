import React, { useState, useEffect } from 'react';
import { 
    getAllCollegesWithStats, 
    updateCollegeDetails, 
    setCollegeStatus,
    addCollege 
} from '../firebase';
import { 
    FaUniversity, FaUsers, FaCalendarAlt, FaBuilding, 
    FaEdit, FaTrash, FaUndo, FaPlus, FaSearch, FaSpinner,
    FaTimes, FaSave, FaCheck
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import RollNumberSchemaBuilder from './RollNumberSchemaBuilder';

function CollegesTab() {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [processing, setProcessing] = useState(null);

    // Add college form
    const [newCollegeName, setNewCollegeName] = useState('');
    const [newCollegeDomain, setNewCollegeDomain] = useState('');
    const [newEmailConfig, setNewEmailConfig] = useState(null);

    useEffect(() => {
        loadColleges();
    }, []);

    const loadColleges = async () => {
        setLoading(true);
        try {
            const data = await getAllCollegesWithStats();
            setColleges(data);
        } catch (error) {
            console.error('Error loading colleges:', error);
            toast.error('Failed to load colleges');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCollege = async (e) => {
        e.preventDefault();
        if (!newCollegeName || !newCollegeDomain) {
            toast.warn('Please enter college name and domain');
            return;
        }
        if (!newEmailConfig) {
            toast.warn('Please configure and save the email pattern logic');
            return;
        }

        setProcessing('add');
        try {
            await addCollege(newCollegeName, newCollegeDomain, newEmailConfig);
            toast.success('College added successfully!');
            setShowAddModal(false);
            setNewCollegeName('');
            setNewCollegeDomain('');
            setNewEmailConfig(null);
            loadColleges();
        } catch (error) {
            console.error('Error adding college:', error);
            toast.error('Failed to add college');
        } finally {
            setProcessing(null);
        }
    };

    const handleEditCollege = async (e) => {
        e.preventDefault();
        if (!selectedCollege) return;

        setProcessing('edit');
        try {
            await updateCollegeDetails(selectedCollege.id, {
                name: selectedCollege.name,
                domain: selectedCollege.domain,
                emailConfig: selectedCollege.emailConfig
            });
            toast.success('College updated successfully!');
            setShowEditModal(false);
            setSelectedCollege(null);
            loadColleges();
        } catch (error) {
            console.error('Error updating college:', error);
            toast.error('Failed to update college');
        } finally {
            setProcessing(null);
        }
    };

    const handleToggleStatus = async (college) => {
        const newStatus = college.status === 'inactive' ? true : false;
        const action = newStatus ? 'reactivate' : 'deactivate';
        
        if (!confirm(`Are you sure you want to ${action} ${college.name}?`)) {
            return;
        }

        setProcessing(college.id);
        try {
            await setCollegeStatus(college.id, newStatus);
            toast.success(`College ${newStatus ? 'reactivated' : 'deactivated'} successfully!`);
            loadColleges();
        } catch (error) {
            console.error('Error toggling college status:', error);
            toast.error('Failed to update college status');
        } finally {
            setProcessing(null);
        }
    };

    const filteredColleges = colleges.filter(college => {
        const matchesSearch = college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            college.domain.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = showInactive || college.status !== 'inactive';
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search colleges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                        />
                        Show inactive
                    </label>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors"
                    >
                        <FaPlus /> Add College
                    </button>
                </div>
            </div>

            {/* Colleges Grid */}
            {filteredColleges.length === 0 ? (
                <div className="text-center py-12">
                    <FaUniversity className="text-5xl text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No colleges found</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredColleges.map(college => (
                        <div 
                            key={college.id}
                            className={`bg-slate-800/50 rounded-xl p-5 border transition-colors ${
                                college.status === 'inactive' 
                                    ? 'border-red-500/30 opacity-60' 
                                    : 'border-slate-700/50 hover:border-purple-500/30'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-xl">
                                        <FaUniversity className="text-xl text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{college.name}</h3>
                                        <p className="text-gray-500 text-sm">{college.domain}</p>
                                    </div>
                                </div>
                                {college.status === 'inactive' && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                        Inactive
                                    </span>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                    <FaUsers className="text-blue-400 mx-auto mb-1" />
                                    <p className="text-white font-semibold">{college.stats?.users || 0}</p>
                                    <p className="text-gray-500 text-xs">Users</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                    <FaCalendarAlt className="text-purple-400 mx-auto mb-1" />
                                    <p className="text-white font-semibold">{college.stats?.events || 0}</p>
                                    <p className="text-gray-500 text-xs">Events</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                    <FaBuilding className="text-orange-400 mx-auto mb-1" />
                                    <p className="text-white font-semibold">{college.stats?.clubs || 0}</p>
                                    <p className="text-gray-500 text-xs">Clubs</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedCollege({ ...college });
                                        setShowEditModal(true);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
                                >
                                    <FaEdit /> Edit
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(college)}
                                    disabled={processing === college.id}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 ${
                                        college.status === 'inactive'
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    }`}
                                >
                                    {college.status === 'inactive' ? (
                                        <><FaUndo /> Restore</>
                                    ) : (
                                        <><FaTrash /> Deactivate</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add College Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700/50">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Add New College</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleAddCollege} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    College Name
                                </label>
                                <input
                                    type="text"
                                    value={newCollegeName}
                                    onChange={(e) => setNewCollegeName(e.target.value)}
                                    placeholder="e.g., CVR College of Engineering"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Email Domain
                                </label>
                                <input
                                    type="text"
                                    value={newCollegeDomain}
                                    onChange={(e) => setNewCollegeDomain(e.target.value)}
                                    placeholder="e.g., cvr.ac.in"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Email Pattern Configuration
                                </label>
                                <RollNumberSchemaBuilder onConfigSaved={setNewEmailConfig} />
                                {newEmailConfig && (
                                    <p className="mt-2 text-green-400 text-sm flex items-center gap-2">
                                        <FaCheck /> Pattern logic saved
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={processing === 'add'}
                                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing === 'add' ? (
                                    <><FaSpinner className="animate-spin" /> Adding...</>
                                ) : (
                                    <><FaPlus /> Add College</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit College Modal */}
            {showEditModal && selectedCollege && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700/50">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Edit College</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedCollege(null);
                                }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleEditCollege} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    College Name
                                </label>
                                <input
                                    type="text"
                                    value={selectedCollege.name}
                                    onChange={(e) => setSelectedCollege({ ...selectedCollege, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Email Domain
                                </label>
                                <input
                                    type="text"
                                    value={selectedCollege.domain}
                                    onChange={(e) => setSelectedCollege({ ...selectedCollege, domain: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Email Pattern Configuration
                                </label>
                                <RollNumberSchemaBuilder 
                                    initialConfig={selectedCollege.emailConfig}
                                    onConfigSaved={(config) => setSelectedCollege({ ...selectedCollege, emailConfig: config })} 
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={processing === 'edit'}
                                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing === 'edit' ? (
                                    <><FaSpinner className="animate-spin" /> Saving...</>
                                ) : (
                                    <><FaSave /> Save Changes</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CollegesTab;
