import React, { useState, useEffect } from 'react';
import { createFest, updateFest, uploadImage, getCollegeById } from '../firebase';
import { FaTimes, FaUpload, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Timestamp } from 'firebase/firestore';

function CreateFestModal({ collegeId, collegeName, createdBy, onClose, onSuccess, editMode = false, festData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        scope: 'college',
        branchName: '',
        allowOtherColleges: false,
        logoFile: null,
        posterFile: null,
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState([]);

    // Fetch branches from college config
    useEffect(() => {
        const fetchBranches = async () => {
            if (!collegeId) return;
            try {
                const college = await getCollegeById(collegeId);
                if (college?.emailConfig?.mapping) {
                    // Get unique branch names from the mapping
                    const branchNames = [...new Set(Object.values(college.emailConfig.mapping))];
                    setBranches(branchNames.sort());
                }
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };
        fetchBranches();
    }, [collegeId]);

    useEffect(() => {
        if (editMode && festData) {
            setFormData({
                name: festData.name || '',
                startDate: festData.startDate ? new Date(festData.startDate).toISOString().split('T')[0] : '',
                endDate: festData.endDate ? new Date(festData.endDate).toISOString().split('T')[0] : '',
                scope: festData.scope || 'college',
                branchName: festData.branchName || '',
                allowOtherColleges: festData.allowOtherColleges || false,
                logoFile: null,
                posterFile: null,
            });
            setLogoPreview(festData.logoURL || null);
            setPosterPreview(festData.posterURL || null);
        }
    }, [editMode, festData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        if (type === 'logo') {
            setFormData(prev => ({ ...prev, logoFile: file }));
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setFormData(prev => ({ ...prev, posterFile: file }));
            setPosterPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('Please enter fest name');
            return;
        }
        if (!formData.startDate || !formData.endDate) {
            toast.error('Please select start and end dates');
            return;
        }
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error('End date must be after start date');
            return;
        }
        if (formData.scope === 'branch' && !formData.branchName.trim()) {
            toast.error('Please enter branch name');
            return;
        }

        setSubmitting(true);
        try {
            let logoURL = editMode ? festData?.logoURL : null;
            let posterURL = editMode ? festData?.posterURL : null;

            // Upload logo if new file selected
            if (formData.logoFile) {
                const logoPath = `fests/${collegeId}/${Date.now()}_logo_${formData.logoFile.name}`;
                logoURL = await uploadImage(formData.logoFile, logoPath);
            }

            // Upload poster if new file selected
            if (formData.posterFile) {
                const posterPath = `fests/${collegeId}/${Date.now()}_poster_${formData.posterFile.name}`;
                posterURL = await uploadImage(formData.posterFile, posterPath);
            }

            const festPayload = {
                name: formData.name.trim(),
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: Timestamp.fromDate(new Date(formData.endDate)),
                scope: formData.scope,
                allowOtherColleges: formData.allowOtherColleges,
                collegeId,
                collegeName,
            };

            // Add branch name if scope is branch
            if (formData.scope === 'branch') {
                festPayload.branchName = formData.branchName.trim();
            }

            // Add URLs if available
            if (logoURL) festPayload.logoURL = logoURL;
            if (posterURL) festPayload.posterURL = posterURL;

            if (editMode) {
                // Update existing fest
                await updateFest(festData.id, festPayload);
                toast.success('Fest updated successfully!');
            } else {
                // Create new fest
                festPayload.createdBy = createdBy;
                festPayload.facultyCoordinators = [];
                festPayload.studentCoordinators = [];
                await createFest(festPayload);
                toast.success('Fest created successfully!');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving fest:', error);
            toast.error(editMode ? 'Failed to update fest' : 'Failed to create fest');
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-800 my-8 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">
                        {editMode ? 'Edit Fest' : 'Create New Fest'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Fest Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Fest Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., TechFest 2026"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                <FaCalendarAlt className="inline mr-2" />Start Date *
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                <FaCalendarAlt className="inline mr-2" />End Date *
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Scope */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Fest Scope *
                        </label>
                        <select
                            name="scope"
                            value={formData.scope}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="college">College-wide</option>
                            <option value="branch">Specific Branch</option>
                        </select>
                    </div>

                    {/* Branch Name (conditional) */}
                    {formData.scope === 'branch' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Select Branch *
                            </label>
                            <select
                                name="branchName"
                                value={formData.branchName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option value="">-- Select a Branch --</option>
                                {branches.length > 0 ? (
                                    branches.map((branch) => (
                                        <option key={branch} value={branch}>
                                            {branch}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No branches configured</option>
                                )}
                            </select>
                            {branches.length === 0 && (
                                <p className="text-xs text-amber-400 mt-2">
                                    No branches found. Configure email mapping in college settings.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Allow Other Colleges */}
                    <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl">
                        <input
                            type="checkbox"
                            name="allowOtherColleges"
                            id="allowOtherColleges"
                            checked={formData.allowOtherColleges}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-700 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                        />
                        <label htmlFor="allowOtherColleges" className="text-sm text-gray-300 cursor-pointer">
                            Allow students from other colleges to participate
                        </label>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Fest Logo
                        </label>
                        <div className="flex items-start gap-4">
                            {logoPreview && (
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="w-24 h-24 rounded-lg object-cover border-2 border-slate-700"
                                />
                            )}
                            <label className="flex-1 px-4 py-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-500 transition-colors cursor-pointer text-center">
                                <FaUpload className="mx-auto text-3xl text-gray-500 mb-2" />
                                <span className="text-sm text-gray-400">
                                    Click to upload logo (Max 5MB)
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'logo')}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Poster Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Fest Poster
                        </label>
                        <div className="flex items-start gap-4">
                            {posterPreview && (
                                <img
                                    src={posterPreview}
                                    alt="Poster preview"
                                    className="w-32 h-48 rounded-lg object-cover border-2 border-slate-700"
                                />
                            )}
                            <label className="flex-1 px-4 py-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-500 transition-colors cursor-pointer text-center">
                                <FaUpload className="mx-auto text-3xl text-gray-500 mb-2" />
                                <span className="text-sm text-gray-400">
                                    Click to upload poster (Max 5MB)
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'poster')}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Fest' : 'Create Fest')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateFestModal;
