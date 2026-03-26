import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children }) => {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            
            {/* Modal Container */}
            <div 
                className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    <FaTimes size={16} />
                </button>
                
                {/* Header (if title provided) */}
                {title && (
                    <div className="px-6 py-4 border-b border-slate-800 shrink-0">
                        <h2 className="text-xl font-bold text-white pr-10">{title}</h2>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;