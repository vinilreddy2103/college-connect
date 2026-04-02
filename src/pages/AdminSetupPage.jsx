import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, verifyAdminInvite, completeAdminSetup } from '../firebase';
import { 
    FaUserShield, FaSpinner, FaExclamationTriangle, 
    FaCheck, FaUniversity, FaEnvelope
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

function AdminSetupPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Form state
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        setLoading(true);
        try {
            const { valid, invite: inviteData, error: verifyError } = await verifyAdminInvite(token);
            
            if (!valid) {
                setError(verifyError || 'Invalid or expired invite link');
            } else {
                setInvite(inviteData);
            }
        } catch (err) {
            console.error('Error verifying invite:', err);
            setError('Failed to verify invite');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!displayName.trim()) {
            toast.warn('Please enter your name');
            return;
        }
        
        if (password.length < 6) {
            toast.warn('Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            toast.warn('Passwords do not match');
            return;
        }

        setSubmitting(true);
        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, invite.email, password);
            const user = userCredential.user;

            // Complete admin setup (creates Firestore doc, marks invite complete)
            await completeAdminSetup(token, user.uid, displayName.trim());

            toast.success('Account created successfully! Redirecting...');
            
            // Redirect to college admin dashboard
            setTimeout(() => {
                navigate('/college-admin');
            }, 1500);
            
        } catch (err) {
            console.error('Error creating account:', err);
            if (err.code === 'auth/email-already-in-use') {
                toast.error('An account with this email already exists');
            } else {
                toast.error(err.message || 'Failed to create account');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-purple-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
                    <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid Invite</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img src={logo} alt="College Connect" className="w-12 h-12" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            College Connect
                        </span>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FaUserShield className="text-2xl text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Setup</h1>
                    <p className="text-gray-400 mt-2">Complete your account setup</p>
                </div>

                {/* Invite Info */}
                <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <FaEnvelope className="text-gray-400" />
                        <span className="text-white">{invite?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <FaUniversity className="text-purple-400" />
                        <span className="text-purple-300">{invite?.collegeName}</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <><FaSpinner className="animate-spin" /> Creating Account...</>
                        ) : (
                            <><FaCheck /> Complete Setup</>
                        )}
                    </button>
                </form>

                <p className="text-gray-500 text-sm text-center mt-6">
                    Invited by {invite?.invitedBy || 'Super Admin'}
                </p>
            </div>
        </div>
    );
}

export default AdminSetupPage;
