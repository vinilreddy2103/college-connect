import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerificationEmail } from '../firebase'; // We will create this function

function VerifyEmailPage() {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');

    const handleResendEmail = async () => {
        try {
            await resendVerificationEmail();
            setMessage('A new verification email has been sent. Please check your inbox.');
        } catch (error) {
            setMessage('Failed to send verification email. Please try again in a few minutes.');
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white text-center">
            <div className="p-8 bg-slate-800 rounded-lg shadow-lg max-w-md">
                <h1 className="text-3xl font-bold text-sky-400">Verify Your Email</h1>
                <p className="mt-4 text-gray-300">
                    A verification link has been sent to your email address:
                </p>
                <p className="mt-2 font-medium text-yellow-400">{currentUser?.email || 'your email'}</p>
                <p className="mt-4 text-gray-400">
                    Please click the link in that email to complete your signup. Once you have verified, you can log in.
                </p>
                <div className="mt-8">
                    <Link
                        to="/login"
                        className="px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700"
                    >
                        Go to Login
                    </Link>
                </div>
                <div className="mt-6 text-sm">
                    <p className="text-gray-500">
                        Didn't receive an email?
                        <button onClick={handleResendEmail} className="ml-1 text-sky-400 hover:underline focus:outline-none">
                            Resend verification link
                        </button>
                    </p>
                    {message && <p className="mt-4 text-green-400">{message}</p>}
                </div>
            </div>
        </div>
    );
}

export default VerifyEmailPage;