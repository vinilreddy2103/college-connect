import React, { useEffect, useRef } from 'react';
import { FaTimes, FaBell, FaTrash, FaCheckDouble } from 'react-icons/fa';
import NotificationItem from './NotificationItem';

function NotificationSidebar({ 
    isOpen, 
    onClose, 
    notifications = [], 
    onNotificationClick, 
    onDismiss, 
    onMarkAllRead, 
    onClearAll 
}) {
    const sidebarRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // Don't close if clicking on the bell icon
                if (!event.target.closest('[data-notification-bell]')) {
                    onClose();
                }
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        function handleEscape(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div 
                ref={sidebarRef}
                className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-slate-900 border-l border-slate-800 z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                                <FaBell className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Notifications</h2>
                                {unreadCount > 0 && (
                                    <p className="text-xs text-gray-400">{unreadCount} unread</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Action buttons */}
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAllRead}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white text-xs font-medium transition-colors"
                                >
                                    <FaCheckDouble className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={onClearAll}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 text-xs font-medium transition-colors"
                            >
                                <FaTrash className="w-3 h-3" />
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications list */}
                <div className="overflow-y-auto h-[calc(100%-120px)]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                <FaBell className="w-6 h-6 text-gray-600" />
                            </div>
                            <p className="text-gray-400 font-medium">No notifications</p>
                            <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={onNotificationClick}
                                onDismiss={onDismiss}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export default NotificationSidebar;
