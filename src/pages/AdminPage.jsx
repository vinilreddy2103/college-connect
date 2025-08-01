import React, { useState, useEffect } from 'react';
import { addCollege, onCollegesUpdate } from '../firebase';

function AdminPage() {
    const [collegeName, setCollegeName] = useState('');
    const [collegeDomain, setCollegeDomain] = useState('');
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Set up a real-time listener for the colleges collection
    useEffect(() => {
        const unsubscribe = onCollegesUpdate((collegesList) => {
            setColleges(collegesList);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!collegeName || !collegeDomain) {
            setError('Both fields are required.');
            return;
        }
        // Simple domain validation
        if (!collegeDomain.includes('.')) {
            setError('Please enter a valid domain (e.g., example.com).');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await addCollege(collegeName, collegeDomain);
            // No need to manually refresh the list due to the real-time listener
            setCollegeName('');
            setCollegeDomain('');
        } catch (err) {
            setError('Failed to add college. Please try again.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">WebApp Admin Portal</h1>

                {/* Form to add a new college */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New College</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="collegeName" className="block text-sm font-medium text-gray-300">College Name</label>
                            <input
                                id="collegeName"
                                type="text"
                                value={collegeName}
                                onChange={(e) => setCollegeName(e.target.value)}
                                placeholder="e.g., Shri Vishnu Engineering College for Women"
                                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="collegeDomain" className="block text-sm font-medium text-gray-300">College Domain</label>
                            <input
                                id="collegeDomain"
                                type="text"
                                value={collegeDomain}
                                onChange={(e) => setCollegeDomain(e.target.value)}
                                placeholder="e.g., svecw.edu.in"
                                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add College'}
                        </button>
                    </form>
                </div>

                {/* List of existing colleges */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Registered Colleges</h2>
                    {colleges.length > 0 ? (
                        <ul className="space-y-3">
                            {colleges.map(college => (
                                <li key={college.id} className="bg-slate-700 p-3 rounded-md flex justify-between items-center">
                                    <span className="font-medium">{college.name}</span>
                                    <span className="text-gray-400">{college.domain}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">No colleges have been added yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminPage;