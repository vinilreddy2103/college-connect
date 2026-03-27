import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClubsByCollege, searchClubs, CLUB_CATEGORIES, getUserClubs } from '../firebase';
import { FaSearch, FaPlus, FaUsers, FaFilter } from 'react-icons/fa';
import ClubCard from '../components/ClubCard';
import DashboardHeader from '../components/DashboardHeader';
import CreateClubModal from '../components/CreateClubModal';
import { ClubCardSkeleton } from '../components/ui/Skeleton';

function ClubsPage() {
    const { userData, currentUser } = useAuth();
    const navigate = useNavigate();
    const [clubs, setClubs] = useState([]);
    const [userClubs, setUserClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Check if user can create clubs (college admin or faculty)
    const canCreateClub = userData?.role === 'collegeAdmin' || userData?.role === 'faculty' || userData?.role === 'admin';

    useEffect(() => {
        if (userData?.collegeId) {
            loadClubs();
            loadUserClubs();
        }
    }, [userData?.collegeId, selectedCategory, priceFilter]);

    const loadClubs = async () => {
        setLoading(true);
        try {
            const clubsList = await getClubsByCollege(userData.collegeId, {
                category: selectedCategory,
                priceFilter: priceFilter,
            });
            setClubs(clubsList);
        } catch (error) {
            console.error('Error loading clubs:', error);
        }
        setLoading(false);
    };

    const loadUserClubs = async () => {
        if (!currentUser?.uid) return;
        try {
            const clubs = await getUserClubs(currentUser.uid);
            setUserClubs(clubs.map(c => c.clubId));
        } catch (error) {
            console.error('Error loading user clubs:', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            loadClubs();
            return;
        }

        setLoading(true);
        try {
            const results = await searchClubs(searchTerm, userData.collegeId);
            // Apply filters to search results
            let filtered = results;
            if (selectedCategory !== 'all') {
                filtered = filtered.filter(c => c.category === selectedCategory);
            }
            if (priceFilter === 'free') {
                filtered = filtered.filter(c => !c.isPaid);
            } else if (priceFilter === 'paid') {
                filtered = filtered.filter(c => c.isPaid);
            }
            setClubs(filtered);
        } catch (error) {
            console.error('Error searching clubs:', error);
        }
        setLoading(false);
    };

    const handleViewClub = (club) => {
        navigate(`/club/${club.id}`);
    };

    const handleClubCreated = () => {
        setShowCreateModal(false);
        loadClubs();
    };

    const isUserMember = (clubId) => userClubs.includes(clubId);

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <FaUsers className="text-fuchsia-500" />
                            Clubs
                        </h1>
                        <p className="text-gray-400 mt-1">Discover and join clubs at {userData?.collegeName || 'your college'}</p>
                    </div>

                    {canCreateClub && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/25"
                        >
                            <FaPlus /> Create Club
                        </button>
                    )}
                </div>

                {/* Search & Filters */}
                <div className="mb-8 space-y-4">
                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search clubs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50"
                        />
                    </form>

                    {/* Category & Price filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Category pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white'
                                        : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                                }`}
                            >
                                All
                            </button>
                            {CLUB_CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => setSelectedCategory(cat.value)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        selectedCategory === cat.value
                                            ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white'
                                            : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-8 w-px bg-slate-700 hidden sm:block" />

                        {/* Price filter pills */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPriceFilter('all')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    priceFilter === 'all'
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-800/50 text-gray-400 hover:text-white'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setPriceFilter('free')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    priceFilter === 'free'
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800/50 text-gray-400 hover:text-white'
                                }`}
                            >
                                Free
                            </button>
                            <button
                                onClick={() => setPriceFilter('paid')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    priceFilter === 'paid'
                                        ? 'bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30'
                                        : 'bg-slate-800/50 text-gray-400 hover:text-white'
                                }`}
                            >
                                Paid
                            </button>
                        </div>
                    </div>
                </div>

                {/* Clubs Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <ClubCardSkeleton key={i} />
                        ))}
                    </div>
                ) : clubs.length === 0 ? (
                    <div className="text-center py-16">
                        <FaUsers className="mx-auto text-6xl text-gray-700 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400">No clubs found</h3>
                        <p className="text-gray-500 mt-2">
                            {searchTerm ? 'Try a different search term' : 'Be the first to create a club!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clubs.map(club => (
                            <ClubCard
                                key={club.id}
                                club={club}
                                onViewDetails={handleViewClub}
                                isMember={isUserMember(club.id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Create Club Modal */}
            {showCreateModal && (
                <CreateClubModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleClubCreated}
                />
            )}
        </div>
    );
}

export default ClubsPage;
