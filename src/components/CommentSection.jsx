import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { onEventCommentsChange } from '../firebase';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

function CommentSection({ eventId, eventOrganizerId, eventTitle = '', eventPosterURL = '' }) {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!eventId) return;

        setLoading(true);
        const unsubscribe = onEventCommentsChange(eventId, (commentsList) => {
            setComments(commentsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [eventId]);

    // Organize comments into threads (parent comments with their replies)
    const organizeComments = () => {
        const topLevel = comments.filter(c => !c.parentId);
        const replies = comments.filter(c => c.parentId);

        return topLevel.map(comment => ({
            ...comment,
            replies: replies.filter(r => r.parentId === comment.id)
        }));
    };

    const threads = organizeComments();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-300">
                <FaComments className="text-sky-400" />
                <h3 className="font-semibold">
                    Comments {comments.length > 0 && `(${comments.length})`}
                </h3>
            </div>

            {/* Comment input */}
            {currentUser ? (
                <CommentInput 
                    eventId={eventId}
                    eventTitle={eventTitle}
                    eventPosterURL={eventPosterURL}
                />
            ) : (
                <p className="text-sm text-gray-500 bg-slate-700 rounded-lg px-4 py-3">
                    Please log in to comment
                </p>
            )}

            {/* Comments list */}
            <div className="space-y-4 mt-4">
                {threads.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                        No comments yet. Be the first to comment!
                    </p>
                ) : (
                    threads.map(thread => (
                        <div key={thread.id}>
                            <CommentItem
                                comment={thread}
                                eventId={eventId}
                                eventOrganizerId={eventOrganizerId}
                                eventTitle={eventTitle}
                                eventPosterURL={eventPosterURL}
                            />
                            {/* Replies */}
                            {thread.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    eventId={eventId}
                                    eventOrganizerId={eventOrganizerId}
                                    eventTitle={eventTitle}
                                    eventPosterURL={eventPosterURL}
                                    isReply
                                />
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default CommentSection;
