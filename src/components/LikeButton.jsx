import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toggleEventLike, onEventLikesChange } from '../firebase';
import { toast } from 'react-toastify';

function LikeButton({ eventId, eventTitle = '', eventPosterURL = '', onShowLikes, compact = false }) {
    const { currentUser, userData } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!eventId || !currentUser) return;

        const unsubscribe = onEventLikesChange(eventId, currentUser.uid, (data) => {
            if (data.isLiked !== undefined) setIsLiked(data.isLiked);
            if (data.likeCount !== undefined) setLikeCount(data.likeCount);
        });

        return () => unsubscribe();
    }, [eventId, currentUser]);

    const handleLike = async (e) => {
        e.stopPropagation();
        
        if (!currentUser) {
            toast.error("Please log in to like events");
            return;
        }

        setIsLoading(true);
        const wasLiked = isLiked;

        // Trigger animation
        if (!wasLiked) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
        }

        // Optimistic update
        setIsLiked(!wasLiked);
        setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            await toggleEventLike(
                eventId,
                currentUser.uid,
                userData?.displayName || 'Anonymous',
                userData?.photoURL || '',
                eventTitle,
                eventPosterURL
            );
        } catch (error) {
            setIsLiked(wasLiked);
            setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
            toast.error("Failed to update like");
        }

        setIsLoading(false);
    };

    const handleShowLikes = (e) => {
        e.stopPropagation();
        if (onShowLikes && likeCount > 0) {
            onShowLikes();
        }
    };

    if (compact) {
        return (
            <button
                onClick={handleLike}
                disabled={isLoading}
                className={`group flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                    isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-400'
                }`}
            >
                <span className={`transform transition-transform ${isAnimating ? 'animate-heart-beat' : ''}`}>
                    {isLiked ? (
                        <FaHeart className="text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                    ) : (
                        <FaRegHeart className="group-hover:scale-110 transition-transform" />
                    )}
                </span>
                <span className="text-sm font-medium">{likeCount}</span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleLike}
                disabled={isLoading}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    isLiked
                        ? 'bg-gradient-to-r from-rose-600/20 to-pink-600/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-rose-400 hover:border-rose-500/30'
                } disabled:opacity-50`}
            >
                <span className={`transform transition-transform ${isAnimating ? 'animate-heart-beat' : ''}`}>
                    {isLiked ? (
                        <FaHeart className="text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                    ) : (
                        <FaRegHeart className="group-hover:scale-110 transition-transform" />
                    )}
                </span>
                <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
            
            {likeCount > 0 && (
                <button
                    onClick={handleShowLikes}
                    className="text-sm text-gray-500 hover:text-fuchsia-400 transition-colors font-medium"
                >
                    {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                </button>
            )}
        </div>
    );
}

export default LikeButton;
