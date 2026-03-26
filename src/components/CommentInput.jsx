import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { addComment } from '../firebase';
import { toast } from 'react-toastify';

function CommentInput({ eventId, eventTitle = '', eventPosterURL = '', parentId = null, onCommentAdded, placeholder = "Write a comment...", autoFocus = false }) {
    const { currentUser, userData } = useAuth();
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            toast.error("Please log in to comment");
            return;
        }

        if (!text.trim()) return;

        setIsSubmitting(true);

        try {
            await addComment(
                eventId,
                currentUser.uid,
                userData?.displayName || 'Anonymous',
                userData?.photoURL || '',
                text,
                parentId,
                eventTitle,
                eventPosterURL
            );
            setText('');
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            toast.error("Failed to post comment");
        }

        setIsSubmitting(false);
    };

    const defaultAvatar = 'https://via.placeholder.com/32x32.png?text=U';

    return (
        <form onSubmit={handleSubmit} className="flex items-start gap-3">
            <img
                src={userData?.photoURL || defaultAvatar}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                    e.target.src = defaultAvatar;
                }}
            />
            <div className="flex-1 relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    rows={1}
                    className="w-full px-4 py-2 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sky-500 resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!text.trim() || isSubmitting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-sky-400 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                >
                    <FaPaperPlane />
                </button>
            </div>
        </form>
    );
}

export default CommentInput;
