import React from 'react';
import { FaBell } from 'react-icons/fa';

function NotificationBell({ unreadCount = 0, onClick }) {
    return (
        <button
            data-notification-bell
            onClick={onClick}
            className="relative p-2 rounded-xl hover:bg-slate-800/50 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
            title="Notifications"
        >
            <FaBell className="w-5 h-5" />
            
            {/* Unread badge */}
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-rose-500/30 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
}

export default NotificationBell;
