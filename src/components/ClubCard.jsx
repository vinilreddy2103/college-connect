import React from 'react';
import { FaUsers, FaRupeeSign, FaArrowRight } from 'react-icons/fa';
import { formatMembershipFee } from '../firebase';

function ClubCard({ club, onViewDetails, isMember = false }) {
    const placeholderLogo = 'https://via.placeholder.com/100x100.png?text=Club';

    return (
        <div 
            className="group relative gradient-border card-hover overflow-hidden animate-fade-in cursor-pointer"
            onClick={() => onViewDetails(club)}
        >
            {/* Banner area with gradient */}
            <div className="relative h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
                {club.bannerURL && (
                    <img
                        src={club.bannerURL}
                        alt=""
                        className="w-full h-full object-cover opacity-50"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            </div>

            {/* Logo - overlapping banner */}
            <div className="absolute top-12 left-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border-4 border-slate-900 overflow-hidden shadow-xl">
                    <img
                        src={club.logoURL || placeholderLogo}
                        alt={club.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Member badge if user is member */}
            {isMember && (
                <div className="absolute top-3 right-3">
                    <div className="bg-emerald-500/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-semibold text-white">
                        ✓ Member
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="pt-10 pb-4 px-4">
                {/* Club name */}
                <h3 className="text-lg font-bold text-white group-hover:text-fuchsia-400 transition-colors line-clamp-1">
                    {club.name}
                </h3>

                {/* Category badge */}
                <div className="mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-gray-400 capitalize">
                        {club.category || 'Club'}
                    </span>
                </div>

                {/* Description */}
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                    {club.description || 'No description available'}
                </p>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                    {/* Member count */}
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <FaUsers className="text-sm" />
                        <span className="text-sm font-medium">{club.memberCount || 0} members</span>
                    </div>

                    {/* Price badge */}
                    {club.isPaid ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 rounded-lg px-2.5 py-1 border border-fuchsia-500/30">
                            <FaRupeeSign className="text-fuchsia-400 text-xs" />
                            <span className="text-fuchsia-400 font-bold text-sm">
                                {(club.membershipFee / 100).toFixed(0)}
                            </span>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/20 rounded-lg px-2.5 py-1 border border-emerald-500/30">
                            <span className="text-emerald-400 font-bold text-sm">Free</span>
                        </div>
                    )}
                </div>

                {/* View button */}
                <button 
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white text-sm font-medium transition-all group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-600"
                >
                    View Club <FaArrowRight className="text-xs" />
                </button>
            </div>
        </div>
    );
}

export default ClubCard;
