import React, { useState } from 'react';
import { FaShare, FaTwitter, FaWhatsapp, FaFacebook, FaLinkedin, FaLink, FaCheck } from 'react-icons/fa';
import { getShareLinks } from '../firebase';
import { toast } from 'react-toastify';

function ShareButton({ eventId, eventTitle, eventDescription, compact = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareLinks = getShareLinks(eventId, eventTitle, eventDescription);

    const handleCopyLink = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(shareLinks.copyUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const handleShareClick = (e, url) => {
        e.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
        setIsOpen(false);
    };

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const socialButtons = [
        { name: 'Twitter', icon: FaTwitter, url: shareLinks.twitter, color: 'hover:text-sky-400', bg: 'hover:bg-sky-500/10' },
        { name: 'WhatsApp', icon: FaWhatsapp, url: shareLinks.whatsapp, color: 'hover:text-emerald-400', bg: 'hover:bg-emerald-500/10' },
        { name: 'Facebook', icon: FaFacebook, url: shareLinks.facebook, color: 'hover:text-blue-400', bg: 'hover:bg-blue-500/10' },
        { name: 'LinkedIn', icon: FaLinkedin, url: shareLinks.linkedin, color: 'hover:text-indigo-400', bg: 'hover:bg-indigo-500/10' },
    ];

    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={toggleDropdown}
                    className="p-2 text-gray-500 hover:text-fuchsia-400 transition-colors rounded-lg hover:bg-slate-800"
                >
                    <FaShare />
                </button>

                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute right-0 bottom-full mb-2 z-20 card p-2 min-w-[180px] animate-fade-in">
                            {socialButtons.map((social) => (
                                <button
                                    key={social.name}
                                    onClick={(e) => handleShareClick(e, social.url)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 ${social.color} ${social.bg} rounded-lg transition-colors`}
                                >
                                    <social.icon />
                                    <span className="text-sm font-medium">{social.name}</span>
                                </button>
                            ))}
                            <div className="border-t border-slate-700/50 my-2" />
                            <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-lg transition-colors"
                            >
                                {copied ? <FaCheck className="text-emerald-400" /> : <FaLink />}
                                <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-gray-400 font-medium rounded-xl border border-slate-700 hover:text-fuchsia-400 hover:border-fuchsia-500/30 transition-all"
            >
                <FaShare />
                <span>Share</span>
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-2 z-20 card p-4 min-w-[220px] animate-fade-in">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Share on</p>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {socialButtons.map((social) => (
                                <button
                                    key={social.name}
                                    onClick={(e) => handleShareClick(e, social.url)}
                                    title={social.name}
                                    className={`p-3 text-gray-400 ${social.color} ${social.bg} rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all`}
                                >
                                    <social.icon className="mx-auto text-lg" />
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 text-gray-400 font-medium rounded-xl border border-slate-700/50 hover:text-fuchsia-400 hover:border-fuchsia-500/30 transition-all"
                        >
                            {copied ? <FaCheck className="text-emerald-400" /> : <FaLink />}
                            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default ShareButton;
