import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaComment, FaArrowRight, FaRupeeSign, FaUsers } from 'react-icons/fa';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import { formatPrice, getRemainingSpots, isEventSoldOut } from '../firebase';

function EventCard({ event, onViewDetails }) {
    const navigate = useNavigate();
    const placeholderImage = 'https://via.placeholder.com/400x200.png?text=Event+Poster';

    const eventDate = new Date(event.date);
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = eventDate.getDate();
    
    const soldOut = isEventSoldOut(event);
    const remainingSpots = getRemainingSpots(event);

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(event);
        } else {
            navigate(`/event/${event.id}`);
        }
    };

    return (
        <div className="group relative gradient-border card-hover overflow-hidden animate-fade-in">
            {/* Image container */}
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={event.posterURL || placeholderImage}
                    alt={event.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={handleViewDetails}
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                
                {/* Date badge */}
                <div className="absolute top-4 left-4">
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-slate-700/50">
                        <div className="text-xs font-bold text-fuchsia-400">{month}</div>
                        <div className="text-xl font-bold text-white leading-none">{day}</div>
                    </div>
                </div>

                {/* Price badge */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    {event.isPaid ? (
                        <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-xl px-3 py-1.5 flex items-center gap-1 shadow-lg shadow-fuchsia-500/30">
                            <FaRupeeSign className="text-white text-xs" />
                            <span className="text-white font-bold text-sm">{(event.price / 100).toFixed(0)}</span>
                        </div>
                    ) : (
                        <div className="bg-emerald-600/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg shadow-emerald-500/30">
                            <span className="text-white font-bold text-sm">Free</span>
                        </div>
                    )}
                    
                    {/* Sold out badge */}
                    {soldOut && (
                        <div className="bg-rose-600/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
                            <span className="text-white font-bold text-xs">SOLD OUT</span>
                        </div>
                    )}
                </div>

                {/* Quick actions overlay - show below price badge */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ShareButton
                        eventId={event.id}
                        eventTitle={event.title}
                        eventDescription={event.description}
                        compact
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Title */}
                <h3 
                    className="text-lg font-bold text-white mb-2 line-clamp-2 cursor-pointer hover:text-fuchsia-400 transition-colors"
                    onClick={() => onViewDetails(event)}
                >
                    {event.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {event.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-violet-400 text-xs" />
                        <span className="truncate max-w-[120px]">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-violet-400 text-xs" />
                        <span>{event.time}</span>
                    </div>
                    {/* Capacity indicator */}
                    {event.hasCapacity && remainingSpots !== null && (
                        <div className={`flex items-center gap-1.5 ${remainingSpots <= 10 ? 'text-amber-400' : 'text-gray-500'}`}>
                            <FaUsers className="text-xs" />
                            <span className="text-xs font-medium">
                                {remainingSpots > 0 ? `${remainingSpots} left` : 'Full'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Social bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <LikeButton 
                            eventId={event.id} 
                            eventTitle={event.title}
                            eventPosterURL={event.posterURL}
                            compact 
                        />
                        <button
                            onClick={handleViewDetails}
                            className="flex items-center gap-1.5 text-gray-500 hover:text-fuchsia-400 transition-colors"
                        >
                            <FaComment className="text-sm" />
                            <span className="text-sm font-medium">{event.commentCount || 0}</span>
                        </button>
                    </div>
                    
                    <button
                        onClick={handleViewDetails}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg ${
                            soldOut 
                                ? 'bg-slate-600 cursor-not-allowed shadow-none' 
                                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-purple-500/20'
                        }`}
                        disabled={soldOut}
                    >
                        {soldOut ? 'Sold Out' : 'View'} <FaArrowRight className="text-xs" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventCard;