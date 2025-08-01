import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { signInWithGoogle, signInWithEmail } from '../firebase';
import { toast } from 'react-toastify'; // Import toast

function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await signInWithEmail(email, password);
            if (user) {
                if (user.emailVerified) {
                    toast.success("Logged in successfully!");
                    navigate('/dashboard');
                } else {
                    toast.warn("Please verify your email before logging in.");
                    navigate('/verify-email');
                }
            }
        } catch (err) {
            toast.error("Login failed. Please check your credentials.");
            console.error(err);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            const user = await signInWithGoogle();
            if (user) {
                toast.success("Logged in successfully!");
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.message);
            console.error("Login with Google failed:", err);
        }
    };

    // ... rest of the JSX remains the same
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Login</h1>
                    <p className="mt-2 text-gray-400">Welcome back! Please enter your details.</p>
                </div>
                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium text-gray-200 bg-slate-700 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-200">
                    <FcGoogle className="w-5 h-5 mr-3" />
                    Continue with Google
                </button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 text-gray-400 bg-slate-800">OR</span></div>
                </div>
                <form className="space-y-6" onSubmit={handleEmailLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email address</label>
                        <div className="mt-1">
                            <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="you@example.com" />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-300"
                        >
                            Password
                        </label>
                        <div className="mt-1 relative">
                            <input
                                id="password"
                                name="password"
                                // 4. Conditionally change the input type
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                            {/* 5. Add the icon button */}
                            <div
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-sky-400 hover:text-sky-300">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-sky-400 hover:text-sky-300">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
export default LoginPage;