import React, { useState } from 'react';
import { FaReply, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { deleteComment, editComment } from '../firebase';
import { toast } from 'react-toastify';
import CommentInput from './CommentInput';

function CommentItem({ comment, eventId, eventOrganizerId, eventTitle = '', eventPosterURL = '', isReply = false, onReplyAdded }) {
    const { currentUser, userData } = useAuth();
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = currentUser?.uid === comment.userId;
    const isAdmin = userData?.role === 'admin' || userData?.role === 'college_admin';
    const isOrganizer = currentUser?.uid === eventOrganizerId;
    const canDelete = isAuthor || isAdmin || isOrganizer;
    const canEdit = isAuthor;

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        
        setIsDeleting(true);
        try {
            await deleteComment(eventId, comment.id);
            toast.success("Comment deleted");
        } catch (error) {
            toast.error("Failed to delete comment");
        }
        setIsDeleting(false);
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;
        
        try {
            await editComment(eventId, comment.id, editText);
            setIsEditing(false);
            toast.success("Comment updated");
        } catch (error) {
            toast.error("Failed to update comment");
        }
    };

    const handleReplyAdded = () => {
        setShowReplyInput(false);
        if (onReplyAdded) onReplyAdded();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString();
    };

    const defaultAvatar = 'https://via.placeholder.com/32x32.png?text=U';

    return (
        <div className={`${isReply ? 'ml-10 mt-3' : ''}`}>
            <div className="flex gap-3">
                <img
                    src={comment.photoURL || defaultAvatar}
                    alt={comment.displayName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                        e.target.src = defaultAvatar;
                    }}
                />
                <div className="flex-1 min-w-0">
                    <div className="bg-slate-700 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm">
                                {comment.displayName}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                            </span>
                            {comment.updatedAt && (
                                <span className="text-xs text-gray-500">(edited)</span>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <div className="mt-2">
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm resize-none focus:outline-none focus:border-sky-500"
                                    rows={2}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 hover:text-green-300"
                                    >
                                        <FaCheck /> Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditText(comment.text);
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300"
                                    >
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-300 text-sm mt-1 break-words">
                                {comment.text}
                            </p>
                        )}
                    </div>

                    {/* Action buttons */}
                    {!isEditing && (
                        <div className="flex items-center gap-4 mt-1 ml-2">
                            {/* Reply button - only for top-level comments */}
                            {!isReply && currentUser && (
                                <button
                                    onClick={() => setShowReplyInput(!showReplyInput)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-sky-400 transition-colors"
                                >
                                    <FaReply />
                                    <span>Reply</span>
                                </button>
                            )}

                            {/* Edit button */}
                            {canEdit && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-sky-400 transition-colors"
                                >
                                    <FaEdit />
                                    <span>Edit</span>
                                </button>
                            )}

                            {/* Delete button */}
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                    <FaTrash />
                                    <span>Delete</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reply input */}
                    {showReplyInput && (
                        <div className="mt-3">
                            <CommentInput
                                eventId={eventId}
                                eventTitle={eventTitle}
                                eventPosterURL={eventPosterURL}
                                parentId={comment.id}
                                placeholder={`Reply to ${comment.displayName}...`}
                                autoFocus
                                onCommentAdded={handleReplyAdded}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommentItem;
