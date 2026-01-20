import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Ensure this path is correct
import { addCollege, onCollegesUpdate } from '../firebase';
import RollNumberSchemaBuilder from '../components/RollNumberSchemaBuilder';
import { FaSignOutAlt, FaUniversity } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Import toast for better alerts

function AdminPage() {
    const navigate = useNavigate();

    // Form State
    const [collegeName, setCollegeName] = useState('');
    const [collegeDomain, setCollegeDomain] = useState('');
    const [emailConfig, setEmailConfig] = useState(null); // Stores the schema from the builder
    
    // Data State
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch Colleges Real-time
    useEffect(() => {
        const unsubscribe = onCollegesUpdate((collegesList) => {
            setColleges(collegesList);
        });
        return () => unsubscribe();
    }, []);

    // Logout Function
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin/login');
        } catch (err) {
            console.error("Logout Error:", err);
            toast.error("Failed to log out");
        }
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Basic Validation
        if (!collegeName || !collegeDomain) {
            setError('Please enter both College Name and Domain.');
            toast.warn('Please enter both College Name and Domain.');
            return;
        }

        // 2. CRITICAL VALIDATION: Check if Pattern Logic is Saved
        if (!emailConfig) {
            const msg = '⚠️ You must define and SAVE the Pattern Logic before adding the college. Click "Confirm Logic" in the box below.';
            setError(msg);
            toast.error(msg); // Show a popup toast
            return;
        }

        setLoading(true);

        try {
            // 3. Send to Firebase (Name, Domain, AND Config)
            await addCollege(collegeName, collegeDomain, emailConfig);
            
            // 4. Success Reset
            setCollegeName('');
            setCollegeDomain('');
            setEmailConfig(null); // Reset the config state
            setError('');
            toast.success("College added successfully!");

        } catch (err) {
            console.error(err);
            setError('Failed to add college: ' + err.message);
            toast.error(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            
            {/* Header Section */}
            <nav className="bg-slate-800 border-b border-slate-700 px-8 py-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-sky-900/50 p-2 rounded-lg">
                        <FaUniversity className="text-sky-400 text-xl" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Super Admin Portal</h1>
                        <p className="text-xs text-gray-400">Platform Management</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-lg transition-all text-sm font-semibold border border-red-900/50"
                >
                    <FaSignOutAlt />
                    Logout
                </button>
            </nav>

            <div className="p-8 max-w-4xl mx-auto">
                
                {/* Add College Form */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 border border-slate-700">
                    <h2 className="text-xl font-semibold mb-6 text-sky-100 border-b border-slate-700 pb-2">Onboard New College</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">College Name</label>
                                <input
                                    type="text"
                                    value={collegeName}
                                    onChange={(e) => setCollegeName(e.target.value)}
                                    placeholder="e.g. Institute of Technology"
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-sky-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">College Domain</label>
                                <input
                                    type="text"
                                    value={collegeDomain}
                                    onChange={(e) => setCollegeDomain(e.target.value)}
                                    placeholder="e.g. college.edu"
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-sky-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Visual Logic Builder */}
                        <div className="border border-slate-600 rounded-lg p-2 bg-slate-900/50">
                            <RollNumberSchemaBuilder 
                                // Changing key forces reset on successful submit
                                key={colleges.length} 
                                onSave={(config) => setEmailConfig(config)} 
                            />
                        </div>

                        {/* Error Message Display */}
                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-300 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 font-bold text-white bg-sky-600 rounded hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-sky-900/20"
                        >
                            {loading ? 'Processing...' : 'Add College & Configuration'}
                        </button>
                    </form>
                </div>

                {/* List of Registered Colleges */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Registered Colleges</h2>
                    {colleges.length > 0 ? (
                        <div className="space-y-3">
                            {colleges.map(c => (
                                <div key={c.id} className="bg-slate-700 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center border border-slate-600 hover:border-slate-500 transition">
                                    <div className="mb-2 md:mb-0">
                                        <h3 className="font-bold text-white">{c.name}</h3>
                                        <p className="text-sky-400 text-sm">{c.domain}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Status Badge */}
                                        <span className={`px-2 py-1 text-xs rounded border ${c.emailConfig ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                                            {c.emailConfig ? '✓ Logic Configured' : '⚠ No Logic'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No colleges added yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminPage;