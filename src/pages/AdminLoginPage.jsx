import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; 
import { toast } from 'react-toastify';
import { FaUserShield, FaLock } from 'react-icons/fa';

function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // --- DEBUG START ---
        console.log("DEBUG: Attempting login for:", email);

        try {
            // 1. RAW LOGIN
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("DEBUG: 1. Firebase Auth Successful");
            console.log("DEBUG:    User UID:", user.uid);

            // 2. CHECK FIRESTORE
            const userDocRef = doc(db, "users", user.uid);
            console.log("DEBUG: 2. Looking for User Document at path:", `users/${user.uid}`);

            const userDocSnap = await getDoc(userDocRef);

            console.log("DEBUG: 3. Document Snapshot Exists?", userDocSnap.exists());

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                console.log("DEBUG:    User Role Found:", userData.role);

                if (userData.role === 'webAppAdmin' || userData.role === 'collegeAdmin') {
                    console.log("DEBUG:    Access Granted. Redirecting...");
                    toast.success("Admin Access Granted");
                    if (userData.role === 'webAppAdmin') {
                        navigate('/super-admin'); 
                    } else {
                        navigate('/college-admin');
                    }
                } else {
                    console.error("DEBUG:    Access Denied. Role is:", userData.role);
                    await signOut(auth);
                    toast.error("Access Denied: Admins only.");
                }
            } else {
                // THIS IS WHERE YOU ARE HITTING
                console.error("DEBUG:    CRITICAL ERROR - Auth exists but Firestore Doc is missing!");
                console.error("DEBUG:    Solution: Go to Firestore -> 'users' collection -> Create doc with ID:", user.uid);
                
                await signOut(auth);
                toast.error("User record not found in Database.");
            }

        } catch (error) {
            console.error("DEBUG: Authentication Error:", error);
            toast.error("Authentication failed: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-lg shadow-2xl border border-red-900/30">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full bg-red-900/20 mb-4 border border-red-500/20">
                        <FaUserShield className="text-4xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Admin Portal</h2>
                    <p className="text-gray-400 text-sm mt-1">Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Admin Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                            placeholder="admin@platform.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3.5 text-gray-500"><FaLock /></span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-[1.02] disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Authenticate'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginPage;