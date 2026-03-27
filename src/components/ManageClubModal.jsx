import React, { useState, useEffect } from 'react';
import { 
    updateClub, 
    getClubMembers, 
    removeClubMember,
    createNotification 
} from '../firebase';
import { 
    FaUsers, FaTimes, FaRupeeSign, FaSave, FaTrash, 
    FaUserShield, FaUserGraduate, FaCog, FaEdit
} from 'react-icons/fa';
import { toast } from 'react-toastify';

function ManageClubModal({ club, onClose, onUpdate, currentUserName }) {
    const [activeTab, setActiveTab] = useState('settings');
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [saving, setSaving] = useState(false);
    const [removingMember, setRemovingMember] = useState(null);
    
    // Club settings state
    const [clubName, setClubName] = useState(club.name || '');
    const [description, setDescription] = useState(club.description || '');
    const [isPaid, setIsPaid] = useState(club.isPaid || false);
    const [membershipFee, setMembershipFee] = useState(club.membershipFee ? club.membershipFee / 100 : '');
    const [requiresApproval, setRequiresApproval] = useState(club.requiresApproval || false);

    useEffect(() => {
        if (activeTab === 'members') {
            loadMembers();
        }
    }, [activeTab]);

    const loadMembers = async () => {
        setLoadingMembers(true);
        try {
            const { members: membersList } = await getClubMembers(club.id);
            setMembers(membersList);
        } catch (error) {
            console.error('Error loading members:', error);
            toast.error('Failed to load members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!clubName.trim()) {
            toast.error('Club name is required');
            return;
        }

        if (isPaid && (!membershipFee || parseFloat(membershipFee) <= 0)) {
            toast.error('Please enter a valid membership fee');
            return;
        }

        setSaving(true);
        try {
            const updates = {
                name: clubName.trim(),
                description: description.trim(),
                isPaid,
                membershipFee: isPaid ? Math.round(parseFloat(membershipFee) * 100) : 0,
                requiresApproval,
            };

            await updateClub(club.id, updates);
            toast.success('Club settings updated!');
            onUpdate();
        } catch (error) {
            console.error('Error updating club:', error);
            toast.error('Failed to update club settings');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (member) => {
        if (!confirm(`Remove ${member.displayName || member.email} from the club?`)) {
            return;
        }

        setRemovingMember(member.id);
        try {
            await removeClubMember(club.id, member.id, currentUserName);
            toast.success('Member removed');
            setMembers(prev => prev.filter(m => m.id !== member.id));
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error(error.message || 'Failed to remove member');
        } finally {
            setRemovingMember(null);
        }
    };

    const formatJoinedDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700/50">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-xl">
                            <FaCog className="text-purple-400 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Manage Club</h2>
                            <p className="text-gray-400 text-sm">{club.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'settings'
                                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaEdit /> Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'members'
                                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaUsers /> Members ({club.memberCount || 0})
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* Club Name */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Club Name
                                </label>
                                <input
                                    type="text"
                                    value={clubName}
                                    onChange={(e) => setClubName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            {/* Membership Type */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <FaRupeeSign className="text-emerald-400" />
                                        <span className="text-white font-medium">Paid Membership</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPaid}
                                            onChange={(e) => setIsPaid(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {isPaid && (
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">
                                            Membership Fee (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={membershipFee}
                                            onChange={(e) => setMembershipFee(e.target.value)}
                                            min="1"
                                            placeholder="Enter amount"
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <p className="text-gray-500 text-xs mt-2">
                                            New members will need to pay this fee to join.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Require Approval */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FaUserShield className="text-yellow-400" />
                                        <div>
                                            <span className="text-white font-medium">Require Approval</span>
                                            <p className="text-gray-500 text-sm">
                                                New members need coordinator approval to join
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={requiresApproval}
                                            onChange={(e) => setRequiresApproval(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <FaSave />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div>
                            {loadingMembers ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl">
                                            <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
                                                <div className="h-3 bg-slate-700 rounded w-1/4"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : members.length === 0 ? (
                                <div className="text-center py-8">
                                    <FaUsers className="text-4xl text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">No members yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <div 
                                            key={member.id}
                                            className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
                                        >
                                            {member.photoURL ? (
                                                <img 
                                                    src={member.photoURL} 
                                                    alt="" 
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                    <FaUserGraduate className="text-purple-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">
                                                    {member.displayName || 'Unknown'}
                                                </p>
                                                <p className="text-gray-500 text-sm truncate">{member.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs px-2 py-1 rounded ${
                                                    member.role === 'coordinator' 
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : member.role === 'leader'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-slate-700 text-gray-400'
                                                }`}>
                                                    {member.role || 'member'}
                                                </span>
                                                <p className="text-gray-600 text-xs mt-1">
                                                    Joined {formatJoinedDate(member.joinedAt)}
                                                </p>
                                            </div>
                                            {member.role !== 'coordinator' && member.role !== 'leader' && member.id !== club.leaderId && member.id !== club.facultyCoordinatorId && (
                                                <button
                                                    onClick={() => handleRemoveMember(member)}
                                                    disabled={removingMember === member.id}
                                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Remove member"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManageClubModal;
