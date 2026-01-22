import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createEvent, generateAiPoster } from '../firebase';
import { toast } from 'react-toastify';
import { constructSmartPrompt } from '../utils/aiPromptUtils'; 
import AutoPoster from './AutoPoster';
import { FaMagic } from 'react-icons/fa'; // Make sure to install: npm install react-icons

function CreateEventForm({ onClose }) {
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

    const isCollegeAdmin = userData?.role === 'collegeAdmin';

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
        setLoading(true);

        try {
            const eventStatus = isCollegeAdmin ? 'approved' : 'pending';
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
            };

            // posterFile will be either the manual File OR the Blob from AutoPoster
            await createEvent(eventData, posterFile);

            if (isCollegeAdmin) {
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

            {/* 6. Poster Section (AI + Manual) */}
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

            {/* 7. AI Preview Component */}
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

            {/* 8. Success Indicator */}
            {posterFile && (
                <div className="p-3 bg-green-900/30 border border-green-500/50 text-green-400 rounded-md text-sm font-semibold text-center flex items-center justify-center gap-2">
                    ✅ Poster Ready for Submission
                </div>
            )}

            <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-3 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition"
            >
                {loading ? 'Submitting...' : (isCollegeAdmin ? 'Create & Publish Event' : 'Submit for Approval')}
            </button>
        </form>
    );
}

export default CreateEventForm;