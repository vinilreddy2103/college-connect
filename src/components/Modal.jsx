import React from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        // 1. Backdrop (Fixed, covers whole screen)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            
            {/* 2. Modal Container (Constrained Height, Scrollable) */}
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
                
                {/* Header (Stays Fixed at Top) */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800 rounded-t-lg shrink-0">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body (Scrolls independently) */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;