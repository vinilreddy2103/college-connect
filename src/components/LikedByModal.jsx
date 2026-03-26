import React, { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import Modal from './Modal';
import { getEventLikes } from '../firebase';

function LikedByModal({ isOpen, onClose, eventId }) {
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !eventId) return;

        const fetchLikes = async () => {
            setLoading(true);
            try {
                const likesList = await getEventLikes(eventId);
                setLikes(likesList);
            } catch (error) {
                console.error("Error fetching likes:", error);
            }
            setLoading(false);
        };

        fetchLikes();
    }, [isOpen, eventId]);

    const defaultAvatar = 'https://via.placeholder.com/40x40.png?text=U';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Liked by">
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                    </div>
                ) : likes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <FaHeart className="mx-auto text-4xl mb-2 text-gray-600" />
                        <p>No likes yet</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {likes.map((like) => (
                            <li
                                key={like.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                <img
                                    src={like.photoURL || defaultAvatar}
                                    alt={like.displayName}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                        e.target.src = defaultAvatar;
                                    }}
                                />
                                <span className="text-white font-medium">
                                    {like.displayName}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
}

export default LikedByModal;
