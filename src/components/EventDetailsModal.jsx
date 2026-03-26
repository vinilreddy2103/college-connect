import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerForEvent, unregisterFromEvent, formatPrice, getRemainingSpots, isEventSoldOut } from '../firebase';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUserPlus, FaUserCheck, FaTimes, FaUsers, FaTag, FaRupeeSign, FaTicketAlt, FaInfoCircle, FaLock } from 'react-icons/fa';
import Modal from './Modal';
import LikeButton from './LikeButton';
import LikedByModal from './LikedByModal';
import ShareButton from './ShareButton';
import CommentSection from './CommentSection';
import PaymentButton from './PaymentButton';
import { EventDetailsSkeleton } from './ui/Skeleton';

function EventDetailsModal({ isOpen, onClose, event }) {
    const { currentUser, userData, registeredEvents } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLocallyRegistered, setIsLocallyRegistered] = useState(false);
    const [showLikedBy, setShowLikedBy] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        if (event && registeredEvents) {
            setIsLocallyRegistered(registeredEvents.has(event.id));
        }
        setImageLoaded(false);
    }, [event, registeredEvents]);

    const handleRegistration = async () => {
        if (!event) return;
        setIsRegistering(true);
        const wasRegistered = isLocallyRegistered;
        
        setIsLocallyRegistered(!wasRegistered);

        try {
            if (wasRegistered) {
                await unregisterFromEvent(event.id, currentUser.uid, event.title, event.posterURL);
                toast.success("Unregistered successfully.");
            } else {
                await registerForEvent(event.id, currentUser.uid, userData.displayName, event.title, event.posterURL);
                toast.success("Registered successfully!");
            }
        } catch (error) {
            setIsLocallyRegistered(wasRegistered);
            toast.error("Action failed. Please try again.");
            console.error(error);
        }
        setIsRegistering(false);
    };

    const handlePaymentSuccess = () => {
        setIsLocallyRegistered(true);
    };

    if (!event) return null;

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const soldOut = isEventSoldOut(event);
    const remainingSpots = getRemainingSpots(event);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="">
                <div className="space-y-6 animate-fade-in">
                    {/* Hero Image */}
                    <div className="relative -mx-6 -mt-6 rounded-t-2xl overflow-hidden">
                        {!imageLoaded && (
                            <div className="w-full h-64 sm:h-80 skeleton" />
                        )}
                        <img 
                            src={event.posterURL || 'https://via.placeholder.com/800x400.png?text=Event+Poster'} 
                            alt={event.title}
                            className={`w-full h-64 sm:h-80 object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
                            onLoad={() => setImageLoaded(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                        
                        {/* Price badge */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                            {event.isPaid ? (
                                <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-fuchsia-500/30">
                                    <FaRupeeSign className="text-white" />
                                    <span className="text-white font-bold text-lg">{(event.price / 100).toFixed(0)}</span>
                                </div>
                            ) : (
                                <div className="bg-emerald-600/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-emerald-500/30">
                                    <span className="text-white font-bold">Free</span>
                                </div>
                            )}
                            
                            {soldOut && (
                                <div className="bg-rose-600/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
                                    <span className="text-white font-bold text-sm">SOLD OUT</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {event.category && (
                                    <span className="badge badge-gradient flex items-center gap-1">
                                        <FaTag className="text-xs" /> {event.category}
                                    </span>
                                )}
                                {isLocallyRegistered && (
                                    <span className="badge badge-success flex items-center gap-1">
                                        <FaUserCheck className="text-xs" /> Registered
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white">{event.title}</h2>
                        </div>
                    </div>
                    
                    {/* Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                <FaCalendarAlt className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Date</p>
                                <p className="text-sm font-medium text-white">{formattedDate}</p>
                            </div>
                        </div>
                        <div className="card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20">
                                <FaClock className="text-fuchsia-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Time</p>
                                <p className="text-sm font-medium text-white">{event.time}</p>
                            </div>
                        </div>
                        <div className="card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                                <FaMapMarkerAlt className="text-orange-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Venue</p>
                                <p className="text-sm font-medium text-white">{event.venue}</p>
                            </div>
                        </div>
                    </div>

                    {/* Capacity Info */}
                    {event.hasCapacity && (
                        <div className={`card p-4 flex items-center justify-between ${soldOut ? 'border-rose-500/50' : remainingSpots <= 10 ? 'border-amber-500/50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${soldOut ? 'bg-rose-500/20' : 'bg-violet-500/20'}`}>
                                    <FaUsers className={soldOut ? 'text-rose-400' : 'text-violet-400'} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Capacity</p>
                                    <p className="text-sm font-medium text-white">
                                        {event.registrationCount || 0} / {event.maxCapacity} registered
                                    </p>
                                </div>
                            </div>
                            <div className={`text-sm font-semibold ${soldOut ? 'text-rose-400' : remainingSpots <= 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {soldOut ? 'Sold Out' : `${remainingSpots} spots left`}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">About this event</h3>
                        <p className="text-gray-300 leading-relaxed">{event.description}</p>
                    </div>

                    {/* Organizer Info */}
                    {event.organizerName && (
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                                    {event.organizerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Organized by</p>
                                    <p className="font-medium text-white">{event.organizerName}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Actions */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700/50">
                        <LikeButton 
                            eventId={event.id}
                            eventTitle={event.title}
                            eventPosterURL={event.posterURL}
                            onShowLikes={() => setShowLikedBy(true)}
                        />
                        <ShareButton
                            eventId={event.id}
                            eventTitle={event.title}
                            eventDescription={event.description}
                        />
                    </div>

                    {/* Registration / Payment Section */}
                    <div className="card p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <FaTicketAlt className="text-fuchsia-400" />
                            Registration
                        </div>

                        {isLocallyRegistered ? (
                            // Already registered - show unregister option
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-emerald-600/10 rounded-xl border border-emerald-500/30">
                                    <FaUserCheck className="text-emerald-400 text-xl" />
                                    <div>
                                        <p className="font-semibold text-emerald-400">You're registered!</p>
                                        <p className="text-sm text-gray-400">We'll see you at the event.</p>
                                    </div>
                                </div>
                                
                                {/* Only show unregister for free events or if refund policy allows */}
                                {(!event.isPaid || event.refundPolicy === 'manual_refund') && (
                                    <button
                                        onClick={handleRegistration}
                                        disabled={isRegistering}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 text-gray-300 transition-all disabled:opacity-50"
                                    >
                                        {isRegistering ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Cancel Registration</>
                                        )}
                                    </button>
                                )}
                                
                                {event.isPaid && event.refundPolicy === 'no_refund' && (
                                    <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                                        <FaInfoCircle /> This event has a no-refund policy
                                    </p>
                                )}
                            </div>
                        ) : soldOut ? (
                            // Sold out
                            <div className="p-4 bg-rose-600/10 rounded-xl border border-rose-500/30 text-center">
                                <p className="font-semibold text-rose-400">This event is sold out</p>
                                <p className="text-sm text-gray-400 mt-1">Check back later for cancellations</p>
                            </div>
                        ) : event.isPaid ? (
                            // Paid event - show payment button
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Ticket Price</span>
                                    <span className="text-2xl font-bold text-white">{formatPrice(event.price)}</span>
                                </div>
                                
                                {event.hasCapacity && remainingSpots !== null && (
                                    <div className={`text-sm ${remainingSpots <= 10 ? 'text-amber-400' : 'text-gray-400'}`}>
                                        {remainingSpots} spots remaining
                                    </div>
                                )}

                                <PaymentButton 
                                    event={event} 
                                    onSuccess={handlePaymentSuccess}
                                />

                                {/* Refund Policy */}
                                <div className="text-xs text-gray-500 text-center">
                                    <span className="font-medium">Refund Policy: </span>
                                    {event.refundPolicy === 'no_refund' ? (
                                        <span className="text-rose-400">No refunds</span>
                                    ) : (
                                        <span className="text-emerald-400">Refund available (contact organizer)</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Free event - show register button
                            <button
                                onClick={handleRegistration}
                                disabled={isRegistering}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50"
                            >
                                {isRegistering ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <><FaUserPlus /> Register for Free</>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Comments */}
                    <div className="pt-4 border-t border-slate-700/50">
                        <CommentSection
                            eventId={event.id} 
                            eventOrganizerId={event.organizerId}
                            eventTitle={event.title}
                            eventPosterURL={event.posterURL}
                        />
                    </div>
                </div>
            </Modal>

            <LikedByModal
                isOpen={showLikedBy}
                onClose={() => setShowLikedBy(false)}
                eventId={event.id}
            />
        </>
    );
}

export default EventDetailsModal;