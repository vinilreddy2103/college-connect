import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserActivities, onUserActivitiesChange } from '../firebase';
import { FaHeart, FaComment, FaCalendarCheck, FaCalendarTimes, FaArrowRight, FaBell } from 'react-icons/fa';
import DashboardHeader from '../components/DashboardHeader';
import { ActivityItemSkeleton } from '../components/ui/Skeleton';

const activityConfig = {
    like: {
        icon: FaHeart,
        color: 'text-rose-400',
        bgColor: 'bg-gradient-to-br from-rose-500/20 to-pink-500/20',
        borderColor: 'border-rose-500/30',
        label: 'Liked',
        verb: 'liked'
    },
    unlike: {
        icon: FaHeart,
        color: 'text-gray-500',
        bgColor: 'bg-slate-700/50',
        borderColor: 'border-slate-600/50',
        label: 'Unliked',
        verb: 'unliked'
    },
    comment: {
        icon: FaComment,
        color: 'text-fuchsia-400',
        bgColor: 'bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20',
        borderColor: 'border-fuchsia-500/30',
        label: 'Commented',
        verb: 'commented on'
    },
    register: {
        icon: FaCalendarCheck,
        color: 'text-emerald-400',
        bgColor: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20',
        borderColor: 'border-emerald-500/30',
        label: 'Registered',
        verb: 'registered for'
    },
    unregister: {
        icon: FaCalendarTimes,
        color: 'text-orange-400',
        bgColor: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20',
        borderColor: 'border-orange-500/30',
        label: 'Unregistered',
        verb: 'unregistered from'
    }
};

function ActivityItem({ activity }) {
    const config = activityConfig[activity.type] || activityConfig.like;
    const Icon = config.icon;

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div className="group flex gap-4 p-4 card card-hover animate-fade-in">
            {/* Activity Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
                <Icon className={`text-lg ${config.color}`} />
            </div>

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
                <p className="text-gray-300">
                    <span className="text-white font-semibold">You</span>
                    {' '}{config.verb}{' '}
                    <Link
                        to={`/event/${activity.eventId}`}
                        className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors"
                    >
                        {activity.eventTitle || 'an event'}
                    </Link>
                </p>

                {activity.type === 'comment' && activity.metadata?.commentText && (
                    <p className="text-gray-500 text-sm mt-1.5 line-clamp-2 italic">
                        "{activity.metadata.commentText}"
                    </p>
                )}

                <p className="text-gray-500 text-sm mt-1.5">
                    {formatTime(activity.timestamp)}
                </p>
            </div>

            {/* Event Poster Thumbnail */}
            {activity.eventPosterURL && (
                <Link
                    to={`/event/${activity.eventId}`}
                    className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-700/50 group-hover:border-fuchsia-500/30 transition-colors"
                >
                    <img
                        src={activity.eventPosterURL}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                </Link>
            )}
        </div>
    );
}

function ActivitiesPage() {
    const { currentUser } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onUserActivitiesChange(currentUser.uid, (activitiesList) => {
            setActivities(activitiesList);
            setLoading(false);
        }, 20);

        return () => unsubscribe();
    }, [currentUser]);

    const loadMoreActivities = async () => {
        if (!hasMore || loadingMore || !currentUser) return;

        setLoadingMore(true);
        try {
            const result = await getUserActivities(currentUser.uid, lastDoc, 20);
            setActivities(prev => [...prev, ...result.activities]);
            setLastDoc(result.lastVisible);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error("Error loading more activities:", error);
        }
        setLoadingMore(false);
    };

    const groupedActivities = activities.reduce((groups, activity) => {
        if (!activity.timestamp) return groups;
        
        const date = activity.timestamp.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateKey;
        if (date.toDateString() === today.toDateString()) {
            dateKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateKey = 'Yesterday';
        } else {
            dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(activity);
        return groups;
    }, {});

    return (
        <div className="page-container">
            <DashboardHeader />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="page-header">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/20">
                            <FaBell className="text-2xl text-orange-400" />
                        </div>
                        <h1 className="page-title">Your Activity</h1>
                    </div>
                    <p className="page-subtitle">Track your likes, comments, and registrations</p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <ActivityItemSkeleton key={i} />
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="card text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                            <FaBell className="text-3xl text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No activity yet</h3>
                        <p className="text-gray-400 mb-6">
                            Start exploring events to see your activity here!
                        </p>
                        <Link
                            to="/browse"
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            Browse Events <FaArrowRight />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
                            <div key={dateKey} className="animate-fade-in">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                        {dateKey}
                                    </h2>
                                    <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                                </div>
                                <div className="space-y-3">
                                    {dayActivities.map(activity => (
                                        <ActivityItem key={activity.id} activity={activity} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {hasMore && (
                            <div className="text-center pt-4">
                                <button
                                    onClick={loadMoreActivities}
                                    disabled={loadingMore}
                                    className="btn-secondary inline-flex items-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default ActivitiesPage;
