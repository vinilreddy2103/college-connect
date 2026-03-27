import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createEvent, generateAiPoster, submitEventForFest } from '../firebase';
import { toast } from 'react-toastify';
import { constructSmartPrompt } from '../utils/aiPromptUtils'; 
import AutoPoster from './AutoPoster';
import { FaMagic, FaRupeeSign, FaUsers, FaTicketAlt, FaTrophy } from 'react-icons/fa';

function CreateEventForm({ onClose, festId = null, festName = null, clubId = null, clubName = null }) {
    const { userData } = useAuth();
    
    // --- Original State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [venue, setVenue] = useState('');
    const [posterFile, setPosterFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- New AI State ---
    const [aiLoading, setAiLoading] = useState(false);
    const [aiImage, setAiImage] = useState(null); 
    const [eventType, setEventType] = useState('general');

    // --- Paid Event State ---
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState('');
    const [hasCapacity, setHasCapacity] = useState(false);
    const [maxCapacity, setMaxCapacity] = useState('');
    const [refundPolicy, setRefundPolicy] = useState('no_refund');

    const isCollegeAdmin = userData?.role === 'collegeAdmin';
    
    // Check if this is a fest or club event submission
    const isFestEvent = !!festId;
    const isClubEvent = !!clubId;
    const needsApproval = isFestEvent || isClubEvent || !isCollegeAdmin;

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPosterFile(e.target.files[0]);
            setAiImage(null); // Clear AI preview if user manually uploads a file
        }
    };

    // --- AI Logic ---
    const handleGenerateAi = async () => {
        if (!title) {
            toast.warn("Please enter an Event Title first!");
            return;
        }
        setAiLoading(true);
        try {
            // WE NO LONGER BUILD THE PROMPT HERE.
            // We just send the raw details to the backend.
            
            const base64Image = await generateAiPoster({ 
                title: title,
                description: description || title, // Fallback if description is empty
                eventType: eventType 
            });
            
            setAiImage(base64Image);
            toast.success("AI Enhanced Background Generated!");
        } catch (error) {
            console.error(error);
            toast.error("AI Generation failed.");
        }
        setAiLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: Ensure all fields are present
        if (!title || !description || !date || !time || !venue || !posterFile) {
            toast.error("All fields, including a poster, are required.");
            return;
        }

        // Validate paid event fields
        if (isPaid && (!price || parseFloat(price) <= 0)) {
            toast.error("Please enter a valid price for the paid event.");
            return;
        }

        if (hasCapacity && (!maxCapacity || parseInt(maxCapacity) <= 0)) {
            toast.error("Please enter a valid capacity limit.");
            return;
        }

        setLoading(true);

        try {
            const eventStatus = needsApproval ? 'pending' : 'approved';
            const eventData = {
                title,
                description,
                date,
                time,
                venue,
                organizerId: userData.uid,
                organizerName: userData.displayName,
                collegeId: userData.collegeId,
                collegeName: userData.collegeName,
                status: eventStatus,
                eventType,
                // Pricing fields
                isPaid,
                price: isPaid ? Math.round(parseFloat(price) * 100) : 0, // Store in paisa
                // Capacity fields
                hasCapacity,
                maxCapacity: hasCapacity ? parseInt(maxCapacity) : null,
                registrationCount: 0,
                // Refund policy
                refundPolicy: isPaid ? refundPolicy : null,
                // Fest/Club association
                festId: festId || null,
                festName: festName || null,
                clubId: clubId || null,
                clubName: clubName || null,
            };

            // posterFile will be either the manual File OR the Blob from AutoPoster
            await createEvent(eventData, posterFile);

            if (isFestEvent) {
                toast.success("Event submitted for fest approval!");
            } else if (isClubEvent) {
                toast.success("Event submitted for club coordinator approval!");
            } else if (isCollegeAdmin) {
                toast.success("Event created and published successfully!");
            } else {
                toast.success("Event submitted for approval!");
            }

            onClose(); 

        } catch (error) {
            toast.error("Failed to create event. Please try again.");
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Fest/Club Banner */}
            {(isFestEvent || isClubEvent) && (
                <div className={`p-4 rounded-xl border ${isFestEvent ? 'bg-amber-500/10 border-amber-500/30' : 'bg-purple-500/10 border-purple-500/30'}`}>
                    <div className="flex items-center gap-2">
                        <FaTrophy className={isFestEvent ? 'text-amber-400' : 'text-purple-400'} />
                        <span className="text-sm text-gray-300">
                            Submitting event for: <strong className="text-white">{festName || clubName}</strong>
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        This event will require approval before being published.
                    </p>
                </div>
            )}

            {/* 1. Event Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">Event Title</label>
                <input
                    id="title" type="text" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    required
                />
            </div>

            {/* 2. Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                    id="description" value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    required
                ></textarea>
            </div>

            {/* 3. Event Type (New Field for AI) */}
            <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Event Category (for AI Style)</label>
                 <select 
                    value={eventType} onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                 >
                     <option value="general">General / Academic</option>
                     <option value="technical">Technical / Hackathon</option>
                     <option value="cultural">Cultural / Fest</option>
                     <option value="sports">Sports</option>
                     <option value="workshop">Workshop / Seminar</option>
                 </select>
            </div>

            {/* 4. Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-300">Date</label>
                    <input
                        id="date" type="date" value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-300">Time</label>
                    <input
                        id="time" type="time" value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        required
                    />
                </div>
            </div>

            {/* 5. Venue */}
            <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-300">Venue</label>
                <input
                    id="venue" type="text" value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    required
                />
            </div>

            {/* 6. Pricing Section */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
                <div className="flex items-center gap-3">
                    <FaTicketAlt className="text-fuchsia-400" />
                    <span className="text-sm font-medium text-gray-300">Event Pricing</span>
                </div>
                
                {/* Free/Paid Toggle */}
                <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${!isPaid ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-700 border-slate-600 text-gray-400 hover:border-slate-500'}`}>
                        <input
                            type="radio"
                            name="eventPricing"
                            checked={!isPaid}
                            onChange={() => setIsPaid(false)}
                            className="sr-only"
                        />
                        <span className="font-semibold">Free Event</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${isPaid ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400' : 'bg-slate-700 border-slate-600 text-gray-400 hover:border-slate-500'}`}>
                        <input
                            type="radio"
                            name="eventPricing"
                            checked={isPaid}
                            onChange={() => setIsPaid(true)}
                            className="sr-only"
                        />
                        <FaRupeeSign className="text-sm" />
                        <span className="font-semibold">Paid Event</span>
                    </label>
                </div>

                {/* Price Input (Conditional) */}
                {isPaid && (
                    <div className="animate-fadeIn space-y-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
                                Ticket Price (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input
                                    id="price"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="199"
                                    className="pl-8 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                                />
                            </div>
                        </div>

                        {/* Refund Policy */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Refund Policy</label>
                            <select
                                value={refundPolicy}
                                onChange={(e) => setRefundPolicy(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                            >
                                <option value="no_refund">No Refunds</option>
                                <option value="manual_refund">Manual Refund by Organizer</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* 7. Capacity Section */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={hasCapacity}
                        onChange={(e) => setHasCapacity(e.target.checked)}
                        className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-fuchsia-500 focus:ring-fuchsia-500"
                    />
                    <FaUsers className="text-violet-400" />
                    <span className="text-sm font-medium text-gray-300">Limit registrations</span>
                </label>

                {hasCapacity && (
                    <div className="animate-fadeIn">
                        <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-300 mb-1">
                            Maximum Capacity
                        </label>
                        <input
                            id="maxCapacity"
                            type="number"
                            min="1"
                            value={maxCapacity}
                            onChange={(e) => setMaxCapacity(e.target.value)}
                            placeholder="100"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        />
                    </div>
                )}
            </div>

            {/* 8. Poster Section (AI + Manual) */}
            <div className="flex gap-4 items-end bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex-1">
                    <label htmlFor="poster" className="block text-sm font-medium text-gray-300 mb-1">Upload Manual Poster</label>
                    <input
                        id="poster" type="file"
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-500 transition"
                    />
                </div>
                
                <div className="flex flex-col items-center justify-end pb-1">
                    <span className="text-gray-500 text-xs mb-2 uppercase font-bold">OR</span>
                </div>

                <button 
                    type="button" 
                    onClick={handleGenerateAi} 
                    disabled={aiLoading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-bold transition disabled:opacity-50 h-[42px]"
                >
                    <FaMagic /> {aiLoading ? 'Dreaming...' : 'Generate AI'}
                </button>
            </div>

            {/* 9. AI Preview Component */}
            {aiImage && !posterFile && (
                <AutoPoster 
                    aiBackgroundImage={aiImage}
                    collegeName={userData.collegeName}
                    eventName={title}
                    date={date}
                    venue={venue}
                    onPosterReady={(blob) => {
                        setPosterFile(blob);
                        toast.success("Poster Created & Attached!");
                    }}
                />
            )}

            {/* 10. Success Indicator */}
            {posterFile && (
                <div className="p-3 bg-green-900/30 border border-green-500/50 text-green-400 rounded-md text-sm font-semibold text-center flex items-center justify-center gap-2">
                    ✅ Poster Ready for Submission
                </div>
            )}

            <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-3 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 disabled:opacity-50 transition"
            >
                {loading ? 'Submitting...' : (isCollegeAdmin ? 'Create & Publish Event' : 'Submit for Approval')}
            </button>
        </form>
    );
}

export default CreateEventForm;