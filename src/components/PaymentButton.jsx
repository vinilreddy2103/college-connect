import React, { useState } from 'react';
import { FaLock, FaRupeeSign, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { createRazorpayOrder, verifyPayment, markPaymentFailed, formatPrice } from '../firebase';
import { toast } from 'react-toastify';

function PaymentButton({ event, onSuccess, disabled = false }) {
    const { currentUser, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'failed' | null

    const handlePayment = async () => {
        if (!currentUser || !userData) {
            toast.error('Please login to continue');
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            // Create order in Firestore
            const orderData = await createRazorpayOrder(
                event.id,
                currentUser.uid,
                userData.email,
                userData.displayName
            );

            // Get Razorpay key from environment
            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            
            if (!razorpayKey) {
                toast.error('Payment gateway not configured. Please contact support.');
                setLoading(false);
                return;
            }

            // Configure Razorpay options
            const options = {
                key: razorpayKey,
                amount: orderData.amount, // in paisa
                currency: orderData.currency,
                name: 'College Connect',
                description: `Registration: ${orderData.eventTitle}`,
                // image: removed - causes CORS issues in development
                handler: async function (response) {
                    // Payment successful - verify and complete registration
                    try {
                        await verifyPayment(
                            orderData.paymentId,
                            event.id,
                            currentUser.uid,
                            response.razorpay_payment_id,
                            response.razorpay_order_id,
                            response.razorpay_signature
                        );
                        
                        setStatus('success');
                        toast.success('Payment successful! You are now registered.');
                        if (onSuccess) onSuccess();
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        setStatus('failed');
                        toast.error('Payment verification failed. Please contact support.');
                    }
                    setLoading(false);
                },
                prefill: {
                    name: orderData.prefill.name,
                    email: orderData.prefill.email,
                },
                notes: {
                    eventId: event.id,
                    paymentId: orderData.paymentId,
                },
                theme: {
                    color: '#7c3aed', // Purple to match app theme
                },
                modal: {
                    ondismiss: async function () {
                        // User cancelled payment
                        try {
                            await markPaymentFailed(
                                orderData.paymentId,
                                event.id,
                                currentUser.uid,
                                'User cancelled payment'
                            );
                        } catch (e) {
                            console.error('Error marking cancelled:', e);
                        }
                        setLoading(false);
                    }
                }
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            
            razorpay.on('payment.failed', async function (response) {
                setStatus('failed');
                toast.error('Payment failed. Please try again.');
                
                try {
                    await markPaymentFailed(
                        orderData.paymentId,
                        event.id,
                        currentUser.uid,
                        response.error?.description || 'Payment failed'
                    );
                } catch (e) {
                    console.error('Error marking failed:', e);
                }
                setLoading(false);
            });

            razorpay.open();

        } catch (error) {
            console.error('Payment initialization error:', error);
            setStatus('failed');
            toast.error(error.message || 'Failed to initialize payment');
            setLoading(false);
        }
    };

    // Success state
    if (status === 'success') {
        return (
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/50">
                <FaCheckCircle />
                <span className="font-semibold">Payment Complete!</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <button
                onClick={handlePayment}
                disabled={loading || disabled}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold text-white rounded-xl transition-all transform ${
                    loading || disabled
                        ? 'bg-slate-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30'
                }`}
            >
                {loading ? (
                    <>
                        <FaSpinner className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <FaRupeeSign />
                        Pay {formatPrice(event.price)} & Register
                    </>
                )}
            </button>
            
            {/* Security note */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <FaLock className="text-emerald-500" />
                <span>Secure payment powered by Razorpay</span>
            </div>

            {/* Failed state */}
            {status === 'failed' && (
                <div className="flex items-center justify-center gap-2 p-3 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/50 text-sm">
                    <FaExclamationTriangle />
                    <span>Payment failed. Please try again.</span>
                </div>
            )}
        </div>
    );
}

export default PaymentButton;
