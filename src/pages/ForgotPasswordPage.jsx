import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '../firebase';
import { toast } from 'react-toastify'; // Import toast

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendPasswordReset(email);
            toast.success('Password reset email sent! Please check your inbox.');
        } catch (err) {
            toast.error('Failed to send reset email. Please check the email address.');
            console.error(err);
        }
        setLoading(false);
    };

    // ... rest of the JSX remains the same
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
                    <p className="mt-2 text-gray-400">Enter your email and we'll send you a link to get back into your account.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email" name="email" type="email"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email" required
                                className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-400">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;