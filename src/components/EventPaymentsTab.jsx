import React, { useState, useEffect } from 'react';
import { getEventPayments, processRefund, formatPrice } from '../firebase';
import { toast } from 'react-toastify';
import { FaRupeeSign, FaCheckCircle, FaTimesCircle, FaUndo, FaClock, FaUsers, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

function EventPaymentsTab({ event }) {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refundingId, setRefundingId] = useState(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [refundReason, setRefundReason] = useState('');

    useEffect(() => {
        if (event?.id) {
            loadPayments();
        }
    }, [event?.id]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const result = await getEventPayments(event.id, null, 50);
            setPayments(result.payments);
            setStats(result.stats);
            setLastDoc(result.lastVisible);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading payments:', error);
            toast.error('Failed to load payments');
        }
        setLoading(false);
    };

    const loadMorePayments = async () => {
        if (!hasMore || loadingMore) return;
        
        setLoadingMore(true);
        try {
            const result = await getEventPayments(event.id, lastDoc, 50);
            setPayments(prev => [...prev, ...result.payments]);
            setLastDoc(result.lastVisible);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading more payments:', error);
        }
        setLoadingMore(false);
    };

    const handleRefundClick = (payment) => {
        if (event.refundPolicy === 'no_refund') {
            toast.error('This event has a no-refund policy');
            return;
        }
        setSelectedPayment(payment);
        setRefundReason('');
        setShowRefundModal(true);
    };

    const handleProcessRefund = async () => {
        if (!selectedPayment || !refundReason.trim()) {
            toast.error('Please provide a reason for the refund');
            return;
        }

        setRefundingId(selectedPayment.id);
        try {
            await processRefund(selectedPayment.id, event.id, selectedPayment.userId, refundReason);
            toast.success('Refund processed successfully');
            setShowRefundModal(false);
            loadPayments(); // Reload to update stats
        } catch (error) {
            console.error('Error processing refund:', error);
            toast.error(error.message || 'Failed to process refund');
        }
        setRefundingId(null);
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: 'badge-success',
            failed: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
            refunded: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
            pending: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
        };
        
        const labels = {
            success: 'Paid',
            failed: 'Failed',
            refunded: 'Refunded',
            pending: 'Pending',
        };

        return (
            <span className={`badge text-xs ${styles[status] || styles.pending}`}>
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
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!event?.isPaid) {
        return (
            <div className="card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                    <FaRupeeSign className="text-2xl text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">This is a free event</h3>
                <p className="text-gray-400">Payment tracking is only available for paid events.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <FaChartLine className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Revenue</p>
                                <p className="text-xl font-bold text-white">{formatPrice(stats.totalRevenue)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-fuchsia-500/20">
                                <FaCheckCircle className="text-fuchsia-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Successful Payments</p>
                                <p className="text-xl font-bold text-white">{stats.successfulPayments}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/20">
                                <FaUsers className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Transactions</p>
                                <p className="text-xl font-bold text-white">{stats.totalPayments}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payments List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="card p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full skeleton" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 skeleton rounded" />
                                    <div className="h-3 w-24 skeleton rounded" />
                                </div>
                                <div className="h-6 w-16 skeleton rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : payments.length === 0 ? (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                        <FaRupeeSign className="text-2xl text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No payments yet</h3>
                    <p className="text-gray-400">Payments will appear here when attendees register.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                                                    {(payment.userName || payment.userEmail || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{payment.userName || 'User'}</p>
                                                    <p className="text-xs text-gray-500">{payment.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {formatDate(payment.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-semibold ${payment.status === 'refunded' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                {formatPrice(payment.amount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {payment.status === 'success' && event.refundPolicy === 'manual_refund' && (
                                                <button
                                                    onClick={() => handleRefundClick(payment)}
                                                    disabled={refundingId === payment.id}
                                                    className="text-amber-400 hover:text-amber-300 text-sm font-medium disabled:opacity-50"
                                                >
                                                    {refundingId === payment.id ? 'Processing...' : 'Refund'}
                                                </button>
                                            )}
                                            {payment.status === 'refunded' && (
                                                <span className="text-xs text-gray-500">
                                                    {payment.refundReason && `"${payment.refundReason}"`}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="p-4 text-center border-t border-slate-700/50">
                            <button
                                onClick={loadMorePayments}
                                disabled={loadingMore}
                                className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium"
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="card p-6 max-w-md w-full animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <FaExclamationTriangle className="text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Process Refund</h3>
                        </div>

                        <p className="text-gray-400 mb-4">
                            Are you sure you want to refund <span className="text-white font-medium">{formatPrice(selectedPayment?.amount)}</span> to{' '}
                            <span className="text-white font-medium">{selectedPayment?.userName || selectedPayment?.userEmail}</span>?
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Reason for refund *</label>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="e.g., Event cancelled, User request..."
                                className="input-base w-full h-24 resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="flex-1 btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessRefund}
                                disabled={!refundReason.trim() || refundingId}
                                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {refundingId ? 'Processing...' : 'Confirm Refund'}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                            Note: This will cancel the user's registration and they will be notified.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventPaymentsTab;
