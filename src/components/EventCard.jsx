import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

function EventCard({ event }) {
    const placeholderImage = 'https://via.placeholder.com/400x200.png?text=Event+Poster';

    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        // The only change is on this line: bg-slate-800 is now bg-slate-700
        <div className="bg-slate-700 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <img
                src={event.posterURL || placeholderImage}
                alt={`${event.title} Poster`}
                className="w-full h-48 object-cover"
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
                    <button className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventCard;