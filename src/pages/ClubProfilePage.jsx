import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    getClubById, 
    getClubMembers, 
    getClubEvents, 
    checkClubMembership,
    joinClub,
    leaveClub,
    createClubPaymentOrder,
    verifyClubPayment,
    formatMembershipFee,
    checkPendingJoinRequest
} from '../firebase';
import DashboardHeader from '../components/DashboardHeader';
import EventCard from '../components/EventCard';
import EventDetailsModal from '../components/EventDetailsModal';
import Modal from '../components/Modal';
import CreateEventForm from '../components/CreateEventForm';
import ManageClubModal from '../components/ManageClubModal';
import { 
    FaUsers, FaCalendarAlt, FaArrowLeft, FaInstagram, FaLinkedin, FaGlobe,
    FaUserTie, FaUserGraduate, FaRupeeSign, FaCheckCircle, FaSignOutAlt, FaClock, FaPlus, FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';

function ClubProfilePage() {
    const { clubId } = useParams();
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();
    
    const [club, setClub] = useState(null);
    const [members, setMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [membership, setMembership] = useState(null);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);
    
    // Event modal
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Submit event modal for club members
    const [showSubmitEventModal, setShowSubmitEventModal] = useState(false);
    
    // Manage club modal
    const [showManageModal, setShowManageModal] = useState(false);

    useEffect(() => {
        loadClubData();
    }, [clubId, currentUser]);

    const loadClubData = async () => {
        setLoading(true);
        try {
            const [clubData, membershipData, eventsData] = await Promise.all([
                getClubById(clubId),
                currentUser ? checkClubMembership(clubId, currentUser.uid) : null,
                getClubEvents(clubId),
            ]);
            
            setClub(clubData);
            setMembership(membershipData);
            setEvents(eventsData);
            
            // Check for pending join request if not a member
            if (!membershipData && currentUser) {
                const pending = await checkPendingJoinRequest(clubId, currentUser.uid);
                setHasPendingRequest(pending);
            }
            
            // Load members
            const membersResult = await getClubMembers(clubId);
            setMembers(membersResult.members);
        } catch (error) {
            console.error('Error loading club:', error);
            toast.error('Failed to load club details');
        }
        setLoading(false);
    };

    const handleJoinClub = async () => {
        if (!currentUser) {
            toast.error('Please login to join clubs');
            return;
        }

        setJoining(true);
        try {
            if (club.isPaid) {
                // Create payment order
                const order = await createClubPaymentOrder(
                    clubId,
                    currentUser.uid,
                    userData.email,
                    userData.displayName
                );

                // Open Razorpay
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'College Connect',
                    description: `Membership: ${club.name}`,
                    prefill: order.prefill,
                    handler: async (response) => {
                        try {
                            await verifyClubPayment(
                                order.paymentId,
                                clubId,
                                currentUser.uid,
                                response.razorpay_payment_id,
                                response.razorpay_order_id,
                                response.razorpay_signature
                            );
                            toast.success(`Welcome to ${club.name}!`);
                            loadClubData();
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            toast.error('Payment verification failed');
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            setJoining(false);
                        }
                    },
                    theme: {
                        color: '#8B5CF6'
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                // Free club - join directly (or request if approval required)
                const result = await joinClub(
                    clubId,
                    currentUser.uid,
                    userData.displayName,
                    userData.email,
                    userData.photoURL
                );
                
                if (result?.requiresApproval) {
                    toast.success('Join request submitted! Waiting for faculty approval.');
                    setHasPendingRequest(true);
                } else {
                    toast.success(`Welcome to ${club.name}!`);
                    loadClubData();
                }
            }
        } catch (error) {
            console.error('Error joining club:', error);
            toast.error(error.message || 'Failed to join club');
        }
        setJoining(false);
    };

    const handleLeaveClub = async () => {
        if (!confirm('Are you sure you want to leave this club?')) return;

        setLeaving(true);
        try {
            await leaveClub(clubId, currentUser.uid);
            toast.success('You have left the club');
            loadClubData();
        } catch (error) {
            console.error('Error leaving club:', error);
            toast.error(error.message || 'Failed to leave club');
        }
        setLeaving(false);
    };

    const handleViewEvent = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <DashboardHeader />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
                </div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-slate-950">
                <DashboardHeader />
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <FaUsers className="text-6xl text-gray-700 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-400">Club not found</h2>
                    <button
                        onClick={() => navigate('/clubs')}
                        className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
                    >
                        Back to Clubs
                    </button>
                </div>
            </div>
        );
    }

    const isLeader = membership?.role === 'leader';
    const isCoordinator = membership?.role === 'coordinator';
    const canManage = isLeader || isCoordinator || userData?.role === 'collegeAdmin';

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHeader />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <button
                    onClick={() => navigate('/clubs')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <FaArrowLeft /> Back to Clubs
                </button>

                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden mb-8">
                    {/* Banner */}
                    <div className="h-48 sm:h-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                        {club.bannerURL && (
                            <img
                                src={club.bannerURL}
                                alt=""
                                className="w-full h-full object-cover opacity-60"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                    </div>

                    {/* Club info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            {/* Logo */}
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 border-4 border-slate-900 overflow-hidden shadow-xl flex-shrink-0">
                                {club.logoURL ? (
                                    <img src={club.logoURL} alt={club.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-fuchsia-600">
                                        <FaUsers className="text-4xl text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 rounded-full bg-slate-800/80 text-gray-300 text-sm capitalize">
                                        {club.category}
                                    </span>
                                    {membership && (
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-1">
                                            <FaCheckCircle className="text-xs" /> Member
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white">{club.name}</h1>
                                <p className="text-gray-300 mt-2 flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <FaUsers className="text-fuchsia-400" />
                                        {club.memberCount || 0} members
                                    </span>
                                    {club.isPaid && (
                                        <span className="flex items-center gap-1 text-fuchsia-400">
                                            <FaRupeeSign />
                                            {(club.membershipFee / 100).toFixed(0)} membership
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Join/Leave Button */}
                            <div className="flex-shrink-0">
                                {!membership ? (
                                    hasPendingRequest ? (
                                        <button
                                            disabled
                                            className="px-6 py-3 bg-yellow-500/20 text-yellow-400 font-semibold rounded-xl flex items-center gap-2 cursor-not-allowed"
                                        >
                                            <FaClock />
                                            Request Pending
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleJoinClub}
                                            disabled={joining}
                                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {joining ? 'Joining...' : (
                                                <>
                                                    {club.isPaid ? `Join - ₹${(club.membershipFee / 100).toFixed(0)}` : 
                                                     club.requiresApproval ? 'Request to Join' : 'Join Club'}
                                                </>
                                            )}
                                        </button>
                                    )
                                ) : (
                                    <div className="flex gap-2">
                                        {canManage && (
                                            <button
                                                onClick={() => setShowManageModal(true)}
                                                className="px-4 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
                                            >
                                                <FaCog />
                                                Manage
                                            </button>
                                        )}
                                        {!isLeader && !isCoordinator && (
                                            <button
                                                onClick={handleLeaveClub}
                                                disabled={leaving}
                                                className="px-4 py-3 bg-rose-500/20 text-rose-400 font-semibold rounded-xl hover:bg-rose-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <FaSignOutAlt />
                                                {leaving ? 'Leaving...' : 'Leave'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-slate-800 pb-2">
                    {['about', 'events', 'members'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                                activeTab === tab
                                    ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'about' && (
                    <div className="space-y-8">
                        {/* Leadership */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Leadership</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Faculty Coordinator */}
                                <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <FaUserTie className="text-indigo-400 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Faculty Coordinator</p>
                                        <p className="text-white font-medium">{club.facultyCoordinatorName || 'Not assigned'}</p>
                                    </div>
                                </div>

                                {/* Student Leader */}
                                <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                                        <FaUserGraduate className="text-fuchsia-400 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Student Leader</p>
                                        <p className="text-white font-medium">{club.leaderName || 'Not assigned'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{club.description}</p>
                            
                            {/* Tags */}
                            {club.tags && club.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {club.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-700/50 text-gray-400 rounded-full text-sm">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        {club.socialLinks && (club.socialLinks.instagram || club.socialLinks.linkedin || club.socialLinks.website) && (
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
                                <div className="flex flex-wrap gap-4">
                                    {club.socialLinks.instagram && (
                                        <a
                                            href={`https://instagram.com/${club.socialLinks.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                                        >
                                            <FaInstagram /> Instagram
                                        </a>
                                    )}
                                    {club.socialLinks.linkedin && (
                                        <a
                                            href={club.socialLinks.linkedin.startsWith('http') ? club.socialLinks.linkedin : `https://${club.socialLinks.linkedin}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:opacity-90 transition-opacity"
                                        >
                                            <FaLinkedin /> LinkedIn
                                        </a>
                                    )}
                                    {club.socialLinks.website && (
                                        <a
                                            href={club.socialLinks.website.startsWith('http') ? club.socialLinks.website : `https://${club.socialLinks.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl hover:opacity-90 transition-opacity"
                                        >
                                            <FaGlobe /> Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'events' && (
                    <div>
                        {/* Submit Event Button for Members */}
                        {membership && (
                            <div className="mb-6 flex justify-end">
                                <button
                                    onClick={() => setShowSubmitEventModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all"
                                >
                                    <FaPlus /> Submit Event
                                </button>
                            </div>
                        )}
                        
                        {events.length === 0 ? (
                            <div className="text-center py-16">
                                <FaCalendarAlt className="mx-auto text-5xl text-gray-700 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-400">No upcoming events</h3>
                                <p className="text-gray-500 mt-2">This club hasn't scheduled any events yet</p>
                                {membership && (
                                    <button
                                        onClick={() => setShowSubmitEventModal(true)}
                                        className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
                                    >
                                        Be the first to submit an event!
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-6">
                                {events.map(event => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onViewDetails={handleViewEvent}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div>
                        {members.length === 0 ? (
                            <div className="text-center py-16">
                                <FaUsers className="mx-auto text-5xl text-gray-700 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-400">No members yet</h3>
                                <p className="text-gray-500 mt-2">Be the first to join!</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {members.map(member => (
                                    <div key={member.id} className="card p-4 flex items-center gap-4">
                                        {member.photoURL ? (
                                            <img
                                                src={member.photoURL}
                                                alt={member.displayName}
                                                className="w-12 h-12 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">
                                                    {member.displayName?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{member.displayName}</p>
                                            <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                                        </div>
                                        {(member.role === 'leader' || member.role === 'coordinator') && (
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                                member.role === 'leader' 
                                                    ? 'bg-fuchsia-500/20 text-fuchsia-400' 
                                                    : 'bg-indigo-500/20 text-indigo-400'
                                            }`}>
                                                {member.role === 'leader' ? 'Leader' : 'Coordinator'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Event Details Modal */}
            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedEvent(null);
                    }}
                />
            )}

            {/* Submit Club Event Modal */}
            {showSubmitEventModal && club && (
                <Modal 
                    isOpen={showSubmitEventModal} 
                    onClose={() => setShowSubmitEventModal(false)}
                    title={`Submit Event for ${club.name}`}
                >
                    <CreateEventForm
                        onClose={() => {
                            setShowSubmitEventModal(false);
                            loadClubData();
                        }}
                        clubId={club.id}
                        clubName={club.name}
                    />
                </Modal>
            )}

            {/* Manage Club Modal */}
            {showManageModal && club && (
                <ManageClubModal
                    club={club}
                    onClose={() => setShowManageModal(false)}
                    onUpdate={() => {
                        loadClubData();
                        setShowManageModal(false);
                    }}
                    currentUserName={userData?.displayName || 'Coordinator'}
                />
            )}
        </div>
    );
}

export default ClubProfilePage;
