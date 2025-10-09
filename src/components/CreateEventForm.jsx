import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createEvent } from '../firebase';
import { toast } from 'react-toastify';

function CreateEventForm({ onClose }) {
    const { userData } = useAuth(); // Get user data to check their role
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [venue, setVenue] = useState('');
    const [posterFile, setPosterFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Determine if the user is a College Admin
    const isCollegeAdmin = userData?.role === 'collegeAdmin';

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPosterFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !description || !date || !time || !venue || !posterFile) {
            toast.error("All fields, including a poster, are required.");
            return;
        }
        setLoading(true);

        try {
            // Set the status based on the user's role
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
                status: eventStatus, // Use the dynamically set status
            };

            await createEvent(eventData, posterFile);

            // Show a different success message based on the role
            if (isCollegeAdmin) {
                toast.success("Event created and published successfully!");
            } else {
                toast.success("Event submitted for approval!");
            }

            onClose(); // Close the modal on success

        } catch (error) {
            toast.error("Failed to create event. Please try again.");
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">Event Title</label>
                <input
                    id="title" type="text" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    required
                />
            </div>
            {/* Description */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-300">Date</label>
                    <input
                        id="date" type="date" value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        required
                    />
                </div>
                {/* Time */}
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

            {/* Venue */}
            <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-300">Venue</label>
                <input
                    id="venue" type="text" value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    required
                />
            </div>

            {/* Poster Upload */}
            <div>
                <label htmlFor="poster" className="block text-sm font-medium text-gray-300">Event Poster</label>
                <input
                    id="poster" type="file"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg"
                    className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                    required
                />
            </div>
            <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
            >
                {/* Change the button text based on the user's role */}
                {loading ? 'Submitting...' : (isCollegeAdmin ? 'Create and Publish Event' : 'Submit for Approval')}
            </button>
        </form>
    );
}

export default CreateEventForm;