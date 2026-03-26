import React from 'react';
import { FaHeart, FaComment, FaTicketAlt, FaEdit, FaBan, FaClock, FaCheckCircle, FaUndo, FaTimes } from 'react-icons/fa';

const NOTIFICATION_ICONS = {
    like: { icon: FaHeart, color: 'text-rose-400', bg: 'bg-rose-500/20' },
    comment: { icon: FaComment, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    registration: { icon: FaTicketAlt, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    event_update: { icon: FaEdit, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    event_cancelled: { icon: FaBan, color: 'text-red-400', bg: 'bg-red-500/20' },
    event_reminder: { icon: FaClock, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    payment_success: { icon: FaCheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    payment_refund: { icon: FaUndo, color: 'text-orange-400', bg: 'bg-orange-500/20' },
};

// Simple time ago function
function timeAgo(date) {
    if (!date) return 'Just now';
    
    const now = new Date();
    const then = date instanceof Date ? date : date.toDate?.() || new Date(date);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return then.toLocaleDateString();
}

function NotificationItem({ notification, onClick, onDismiss }) {
    const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.like;
    const IconComponent = config.icon;

    const time = timeAgo(notification.createdAt);

    return (
        <div 
            className={`group relative px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                !notification.read ? 'bg-slate-800/50' : ''
            }`}
            onClick={() => onClick(notification)}
        >
            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-fuchsia-500 rounded-full" />
            )}

            <div className="flex gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                        {notification.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {time}
                    </p>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-600/50 text-gray-400 hover:text-gray-200 transition-all"
                >
                    <FaTimes className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

export default NotificationItem;
