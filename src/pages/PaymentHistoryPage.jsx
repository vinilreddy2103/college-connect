import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPayments, formatPrice } from '../firebase';
import { FaHistory, FaCheckCircle, FaTimesCircle, FaUndo, FaClock, FaReceipt, FaCalendarAlt } from 'react-icons/fa';
import DashboardHeader from '../components/DashboardHeader';
import { useNavigate } from 'react-router-dom';

function PaymentHistoryPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadPayments();
        }
    }, [currentUser]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const result = await getUserPayments(currentUser.uid, null, 20);
            setPayments(result.payments);
            setLastDoc(result.lastVisible);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading payments:', error);
        }
        setLoading(false);
    };

    const loadMorePayments = async () => {
        if (!hasMore || loadingMore) return;
        
        setLoadingMore(true);
        try {
            const result = await getUserPayments(currentUser.uid, lastDoc, 20);
            setPayments(prev => [...prev, ...result.payments]);
            setLastDoc(result.lastVisible);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading more payments:', error);
        }
        setLoadingMore(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <FaCheckCircle className="text-emerald-400" />;
            case 'failed':
                return <FaTimesCircle className="text-rose-400" />;
            case 'refunded':
                return <FaUndo className="text-amber-400" />;
            case 'pending':
                return <FaClock className="text-gray-400" />;
            default:
                return <FaClock className="text-gray-400" />;
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: 'badge-success',
            failed: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
            refunded: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
            pending: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
        };
        
        const labels = {
            success: 'Completed',
            failed: 'Failed',
            refunded: 'Refunded',
            pending: 'Pending',
        };

        return (
            <span className={`badge ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="page-container">
            <DashboardHeader />

            <main className="page-content">
                {/* Page Header */}
                <div className="page-header">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20">
                            <FaHistory className="text-2xl text-fuchsia-400" />
                        </div>
                        <h1 className="page-title">Payment History</h1>
                    </div>
                    <p className="page-subtitle">View all your event payment transactions</p>
                </div>

                {/* Payments List */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="card p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl skeleton" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-48 skeleton rounded" />
                                        <div className="h-3 w-32 skeleton rounded" />
                                    </div>
                                    <div className="h-6 w-20 skeleton rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : payments.length === 0 ? (
                    <div className="card text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <FaReceipt className="text-3xl text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No payments yet</h3>
                        <p className="text-gray-400 mb-6">Your payment history will appear here when you register for paid events.</p>
                        <button
                            onClick={() => navigate('/browse')}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            Browse Events
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <div 
                                key={payment.id} 
                                className="card p-5 hover:border-slate-600 transition-colors cursor-pointer"
                                onClick={() => navigate(`/event/${payment.eventId}`)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        payment.status === 'success' ? 'bg-emerald-500/20' :
                                        payment.status === 'failed' ? 'bg-rose-500/20' :
                                        payment.status === 'refunded' ? 'bg-amber-500/20' :
                                        'bg-slate-700'
                                    }`}>
                                        {getStatusIcon(payment.status)}
                                    </div>
                                    
                                    {/* Payment Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate">
                                            {payment.eventTitle || 'Event'}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <FaCalendarAlt className="text-xs" />
                                                {formatDate(payment.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Amount & Status */}
                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${
                                            payment.status === 'refunded' ? 'text-amber-400 line-through' : 'text-white'
                                        }`}>
                                            {formatPrice(payment.amount)}
                                        </div>
                                        <div className="mt-1">
                                            {getStatusBadge(payment.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Refund info */}
                                {payment.status === 'refunded' && payment.refundReason && (
                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                        <p className="text-sm text-amber-400">
                                            <span className="font-medium">Refund reason:</span> {payment.refundReason}
                                        </p>
                                    </div>
                                )}

                                {/* Transaction ID */}
                                {payment.razorpayPaymentId && (
                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                        <p className="text-xs text-gray-500 font-mono">
                                            Transaction ID: {payment.razorpayPaymentId}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Load More */}
                        {hasMore && (
                            <div className="text-center pt-4">
                                <button
                                    onClick={loadMorePayments}
                                    disabled={loadingMore}
                                    className="btn-secondary inline-flex items-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default PaymentHistoryPage;
