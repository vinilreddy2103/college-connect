import React, { useState, useEffect } from 'react';
import { 
    getAllCollegeAdmins, 
    getPendingAdminInvites,
    inviteCollegeAdmin,
    cancelAdminInvite,
    revokeCollegeAdmin,
    onCollegesUpdate
} from '../firebase';
import { 
    FaUserShield, FaEnvelope, FaUniversity, FaPlus, 
    FaSpinner, FaTimes, FaTrash, FaClock, FaCheck,
    FaSearch, FaUserMinus
} from 'react-icons/fa';
import { toast } from 'react-toastify';

function AdminsTab() {
    const [admins, setAdmins] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteCollegeId, setInviteCollegeId] = useState('');
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        loadData();
        const unsubscribe = onCollegesUpdate(setColleges);
        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [adminsData, invitesData] = await Promise.all([
                getAllCollegeAdmins(),
                getPendingAdminInvites()
            ]);
            setAdmins(adminsData);
            setPendingInvites(invitesData);
        } catch (error) {
            console.error('Error loading admins:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail || !inviteCollegeId) {
            toast.warn('Please enter email and select a college');
            return;
        }

        const college = colleges.find(c => c.id === inviteCollegeId);
        if (!college) {
            toast.error('Invalid college selected');
            return;
        }

        setProcessing('invite');
        try {
            const { token } = await inviteCollegeAdmin(inviteEmail, inviteCollegeId, college.name, 'Super Admin');
            
            // Show invite link (in production, this would be sent via email)
            const inviteLink = `${window.location.origin}/admin-setup/${token}`;
            toast.success(
                <div>
                    <p>Invite sent! Share this link:</p>
                    <code className="text-xs break-all">{inviteLink}</code>
                </div>,
                { autoClose: false }
            );
            
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteCollegeId('');
            loadData();
        } catch (error) {
            console.error('Error inviting admin:', error);
            toast.error(error.message || 'Failed to send invite');
        } finally {
            setProcessing(null);
        }
    };

    const handleCancelInvite = async (inviteId) => {
        if (!confirm('Cancel this invite?')) return;

        setProcessing(inviteId);
        try {
            await cancelAdminInvite(inviteId);
            toast.success('Invite cancelled');
            loadData();
        } catch (error) {
            console.error('Error cancelling invite:', error);
            toast.error('Failed to cancel invite');
        } finally {
            setProcessing(null);
        }
    };

    const handleRevokeAdmin = async (admin) => {
        if (!confirm(`Revoke admin access for ${admin.displayName || admin.email}? They will be demoted to faculty.`)) {
            return;
        }

        setProcessing(admin.id);
        try {
            await revokeCollegeAdmin(admin.id, 'Super Admin');
            toast.success('Admin access revoked');
            loadData();
        } catch (error) {
            console.error('Error revoking admin:', error);
            toast.error('Failed to revoke admin access');
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const filteredAdmins = admins.filter(admin => 
        admin.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.collegeName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors"
                >
                    <FaPlus /> Invite Admin
                </button>
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                        <FaClock /> Pending Invites ({pendingInvites.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingInvites.map(invite => (
                            <div 
                                key={invite.id}
                                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <FaEnvelope className="text-yellow-400" />
                                    <div>
                                        <p className="text-white">{invite.email}</p>
                                        <p className="text-gray-500 text-sm">{invite.collegeName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-500 text-sm">
                                        Expires {formatDate(invite.expiresAt)}
                                    </span>
                                    <button
                                        onClick={() => handleCancelInvite(invite.id)}
                                        disabled={processing === invite.id}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Admins */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaUserShield className="text-purple-400" /> 
                    College Admins ({filteredAdmins.length})
                </h3>

                {filteredAdmins.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <FaUserShield className="text-5xl text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No college admins found</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {filteredAdmins.map(admin => (
                            <div 
                                key={admin.id}
                                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                            >
                                <div className="flex items-start gap-4">
                                    {admin.photoURL ? (
                                        <img 
                                            src={admin.photoURL} 
                                            alt="" 
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <FaUserShield className="text-xl text-purple-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white truncate">
                                            {admin.displayName || 'Unnamed Admin'}
                                        </h4>
                                        <p className="text-gray-400 text-sm truncate">{admin.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <FaUniversity className="text-purple-400 text-sm" />
                                            <span className="text-purple-300 text-sm">{admin.collegeName || 'Unknown College'}</span>
                                        </div>
                                        <p className="text-gray-600 text-xs mt-1">
                                            Added {formatDate(admin.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRevokeAdmin(admin)}
                                        disabled={processing === admin.id}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                        title="Revoke admin access"
                                    >
                                        <FaUserMinus />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700/50">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Invite College Admin</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-6">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Assign to College
                                </label>
                                <select
                                    value={inviteCollegeId}
                                    onChange={(e) => setInviteCollegeId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select a college</option>
                                    {colleges.filter(c => c.status !== 'inactive').map(college => (
                                        <option key={college.id} value={college.id}>
                                            {college.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-gray-500 text-sm">
                                An invite link will be generated. Share it with the person to complete their admin setup.
                            </p>
                            <button
                                type="submit"
                                disabled={processing === 'invite'}
                                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing === 'invite' ? (
                                    <><FaSpinner className="animate-spin" /> Sending...</>
                                ) : (
                                    <><FaEnvelope /> Send Invite</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminsTab;
