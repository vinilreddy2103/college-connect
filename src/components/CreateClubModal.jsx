import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createClub, CLUB_CATEGORIES } from '../firebase';
import { toast } from 'react-toastify';
import { FaTimes, FaUpload, FaRupeeSign, FaUsers, FaImage } from 'react-icons/fa';

function CreateClubModal({ isOpen, onClose, onSuccess }) {
    const { userData, currentUser } = useAuth();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('technical');
    const [tags, setTags] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    
    // Leadership
    const [leaderName, setLeaderName] = useState('');
    const [leaderEmail, setLeaderEmail] = useState('');
    
    // Membership fee
    const [isPaid, setIsPaid] = useState(false);
    const [membershipFee, setMembershipFee] = useState('');
    
    // Approval settings
    const [requiresApproval, setRequiresApproval] = useState(false);
    
    // Social links
    const [instagram, setInstagram] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [website, setWebsite] = useState('');
    
    const [loading, setLoading] = useState(false);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error('Please enter a club name');
            return;
        }
        
        if (!description.trim()) {
            toast.error('Please enter a club description');
            return;
        }

        if (isPaid && (!membershipFee || parseFloat(membershipFee) <= 0)) {
            toast.error('Please enter a valid membership fee');
            return;
        }

        setLoading(true);
        try {
            const clubData = {
                name: name.trim(),
                description: description.trim(),
                category,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                collegeId: userData.collegeId,
                collegeName: userData.collegeName,
                
                // Creator is faculty coordinator
                facultyCoordinatorId: currentUser.uid,
                facultyCoordinatorName: userData.displayName,
                facultyCoordinatorEmail: userData.email,
                
                // Student leader (optional)
                leaderId: leaderEmail ? null : null, // Will be set when leader joins
                leaderName: leaderName.trim() || null,
                leaderEmail: leaderEmail.trim() || null,
                
                // Membership
                isPaid,
                membershipFee: isPaid ? Math.round(parseFloat(membershipFee) * 100) : 0,
                requiresApproval,
                
                // Social links
                socialLinks: {
                    instagram: instagram.trim() || null,
                    linkedin: linkedin.trim() || null,
                    website: website.trim() || null,
                },
                
                createdBy: currentUser.uid,
            };

            await createClub(clubData, logoFile, bannerFile);
            toast.success('Club created successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error creating club:', error);
            toast.error('Failed to create club. Please try again.');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white">Create New Club</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Basic Information</h3>
                        
                        {/* Club Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Club Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Coding Club"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is your club about?"
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 resize-none"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                            >
                                {CLUB_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g., coding, web development, AI"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                            />
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Club Images</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Club Logo</label>
                                <div 
                                    onClick={() => document.getElementById('logo-input').click()}
                                    className="relative h-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-fuchsia-500/50 transition-colors overflow-hidden"
                                >
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <FaImage className="mx-auto text-2xl text-gray-500 mb-2" />
                                            <span className="text-sm text-gray-500">Upload Logo</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="logo-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Banner */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Club Banner</label>
                                <div 
                                    onClick={() => document.getElementById('banner-input').click()}
                                    className="relative h-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-fuchsia-500/50 transition-colors overflow-hidden"
                                >
                                    {bannerPreview ? (
                                        <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <FaImage className="mx-auto text-2xl text-gray-500 mb-2" />
                                            <span className="text-sm text-gray-500">Upload Banner</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="banner-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBannerChange}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Student Leader */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Student Leader (Optional)</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Leader Name</label>
                                <input
                                    type="text"
                                    value={leaderName}
                                    onChange={(e) => setLeaderName(e.target.value)}
                                    placeholder="Student leader name"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Leader Email</label>
                                <input
                                    type="email"
                                    value={leaderEmail}
                                    onChange={(e) => setLeaderEmail(e.target.value)}
                                    placeholder="leader@college.edu"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Membership Fee */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Membership</h3>
                        
                        {/* Free/Paid Toggle */}
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!isPaid}
                                    onChange={() => setIsPaid(false)}
                                    className="w-4 h-4 text-fuchsia-500"
                                />
                                <span className="text-gray-300">Free to Join</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={isPaid}
                                    onChange={() => setIsPaid(true)}
                                    className="w-4 h-4 text-fuchsia-500"
                                />
                                <span className="text-gray-300">Paid Membership</span>
                            </label>
                        </div>

                        {isPaid && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Membership Fee (₹)</label>
                                <div className="relative">
                                    <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="number"
                                        value={membershipFee}
                                        onChange={(e) => setMembershipFee(e.target.value)}
                                        placeholder="199"
                                        min="1"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Approval Settings */}
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-medium">Require Approval</h4>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {requiresApproval 
                                            ? "Students must request to join and wait for your approval"
                                            : "Students can join instantly without approval"
                                        }
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRequiresApproval(!requiresApproval)}
                                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                                        requiresApproval ? 'bg-purple-600' : 'bg-slate-600'
                                    }`}
                                >
                                    <span 
                                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                            requiresApproval ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Social Links (Optional)</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
                                <input
                                    type="text"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    placeholder="@clubhandle"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn</label>
                                <input
                                    type="text"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    placeholder="linkedin.com/company/..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                                <input
                                    type="text"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-gray-300 font-semibold hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Club'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateClubModal;
