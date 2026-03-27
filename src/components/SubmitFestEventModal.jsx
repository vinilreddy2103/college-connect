import React, { useState } from 'react';
import { submitEventForFest, uploadImage } from '../firebase';
import { FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Timestamp } from 'firebase/firestore';

function SubmitFestEventModal({ fest, userData, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        posterFile: null,
    });
    const [posterPreview, setPosterPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setFormData(prev => ({ ...prev, posterFile: file }));
        setPosterPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter event title');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Please enter event description');
            return;
        }
        if (!formData.date) {
            toast.error('Please select event date');
            return;
        }
        if (!formData.time) {
            toast.error('Please select event time');
            return;
        }
        if (!formData.venue.trim()) {
            toast.error('Please enter venue');
            return;
        }

        // Check if date is within fest period
        const eventDate = new Date(formData.date);
        if (eventDate < fest.startDate || eventDate > fest.endDate) {
            toast.error(`Event date must be within fest dates (${fest.startDate.toLocaleDateString()} - ${fest.endDate.toLocaleDateString()})`);
            return;
        }

        setSubmitting(true);
        try {
            let posterURL = null;

            // Upload poster if provided
            if (formData.posterFile) {
                const posterPath = `event-posters/${Date.now()}_${formData.posterFile.name}`;
                posterURL = await uploadImage(formData.posterFile, posterPath);
            }

            // Create event data
            const eventData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                date: Timestamp.fromDate(new Date(`${formData.date}T${formData.time}`)),
                time: formData.time,
                venue: formData.venue.trim(),
                posterURL,
                organizerId: userData.uid,
                organizerName: userData.displayName,
                collegeId: userData.collegeId,
                collegeName: userData.collegeName || '',
                isPaid: false,
                price: 0,
                likeCount: 0,
                commentCount: 0,
                registrationCount: 0,
            };

            await submitEventForFest(eventData, fest.id, fest.name);
            toast.success('Event submitted! Awaiting approval from coordinators.');
            onSuccess();
        } catch (error) {
            console.error('Error submitting event:', error);
            toast.error('Failed to submit event. Please try again.');
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-800 my-8 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Submit Event</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            For: <span className="text-indigo-400">{fest.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Info Banner */}
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                        <p className="text-sm text-indigo-300">
                            <strong>Note:</strong> Your event will be reviewed by fest coordinators before being published.
                            Event date must be between <strong>{fest.startDate?.toLocaleDateString()}</strong> and <strong>{fest.endDate?.toLocaleDateString()}</strong>.
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Coding Contest, Dance Battle"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe what the event is about, rules, prizes, etc."
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            required
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                <FaCalendarAlt className="inline mr-2 text-indigo-400" />
                                Event Date *
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                min={fest.startDate?.toISOString().split('T')[0]}
                                max={fest.endDate?.toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                <FaClock className="inline mr-2 text-indigo-400" />
                                Start Time *
                            </label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Venue */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            <FaMapMarkerAlt className="inline mr-2 text-indigo-400" />
                            Venue *
                        </label>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            placeholder="e.g., Main Auditorium, Open Ground"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Poster Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Event Poster (Optional)
                        </label>
                        <div className="flex items-start gap-4">
                            {posterPreview && (
                                <img
                                    src={posterPreview}
                                    alt="Poster preview"
                                    className="w-32 h-40 rounded-lg object-cover border-2 border-slate-700"
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
                                    onChange={handleFileChange}
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
                            {submitting ? 'Submitting...' : 'Submit for Approval'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SubmitFestEventModal;
