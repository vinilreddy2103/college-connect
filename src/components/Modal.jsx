import React from 'react';
import { FaTimes } from 'react-icons/fa';

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) {
        return null;
    }

    return (
        // Main container for the modal overlay
        <div
            className="fixed inset-0 bg-black bg-opacity-75 z-40 flex justify-center items-center"
            onClick={onClose} // Close modal if overlay is clicked
        >
            {/* Modal content container */}
            <div
                className="relative bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl m-8"
                onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;