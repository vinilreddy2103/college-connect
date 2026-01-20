import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

// Added 'onViewDetails' prop
function EventCard({ event, onViewDetails }) {
    const placeholderImage = 'https://via.placeholder.com/400x200.png?text=Event+Poster';

    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="bg-slate-700 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <img
                src={event.posterURL || placeholderImage}
                alt={`${event.title} Poster`}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => onViewDetails(event)} // Clicking image also opens details
            />
            <div className="p-4">
                <h3 className="text-xl font-bold text-white truncate">{event.title}</h3>
                <p className="text-sm text-gray-400 mt-1 truncate">{event.description}</p>

                <div className="mt-4 space-y-2 text-sm text-gray-300">
                    <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-sky-400" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center">
                        <FaClock className="mr-2 text-sky-400" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-sky-400" />
                        <span>{event.venue}</span>
                    </div>
                </div>

                <div className="mt-4 text-right">
                    {/* Changed from Link to Button */}
                    <button
                        onClick={() => onViewDetails(event)}
                        className="inline-block px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventCard;