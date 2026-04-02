import React, { useState, useEffect } from 'react';
import { getAuditLogs, onCollegesUpdate } from '../firebase';
import { 
    FaHistory, FaSearch, FaFilter, FaSpinner, FaUserShield,
    FaUniversity, FaCalendarAlt, FaUserPlus, FaUserMinus,
    FaEdit, FaTrash, FaCheck, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const ACTION_LABELS = {
    invite_admin: { label: 'Invited Admin', icon: FaUserPlus, color: 'blue' },
    admin_setup_complete: { label: 'Admin Setup Complete', icon: FaCheck, color: 'green' },
    revoke_admin: { label: 'Revoked Admin', icon: FaUserMinus, color: 'red' },
    update_college: { label: 'Updated College', icon: FaEdit, color: 'yellow' },
    deactivate_college: { label: 'Deactivated College', icon: FaTrash, color: 'red' },
    reactivate_college: { label: 'Reactivated College', icon: FaCheck, color: 'green' },
    approve_event: { label: 'Approved Event', icon: FaCheck, color: 'green' },
    reject_event: { label: 'Rejected Event', icon: FaTimes, color: 'red' },
    default: { label: 'Action', icon: FaHistory, color: 'gray' }
};

function AuditLogsTab() {
    const [logs, setLogs] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterCollege, setFilterCollege] = useState('');

    useEffect(() => {
        loadLogs();
        const unsubscribe = onCollegesUpdate(setColleges);
        return () => unsubscribe();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const logsData = await getAuditLogs({}, 100);
            setLogs(logsData);
        } catch (error) {
            console.error('Error loading audit logs:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date) => {
        if (!date) return 'Unknown';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionInfo = (action) => {
        return ACTION_LABELS[action] || ACTION_LABELS.default;
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesAction = !filterAction || log.action === filterAction;
        const matchesCollege = !filterCollege || log.details?.collegeId === filterCollege;
        
        return matchesSearch && matchesAction && matchesCollege;
    });

    const uniqueActions = [...new Set(logs.map(log => log.action))];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">All Actions</option>
                    {uniqueActions.map(action => (
                        <option key={action} value={action}>
                            {getActionInfo(action).label}
                        </option>
                    ))}
                </select>
                <select
                    value={filterCollege}
                    onChange={(e) => setFilterCollege(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">All Colleges</option>
                    {colleges.map(college => (
                        <option key={college.id} value={college.id}>
                            {college.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Logs List */}
            {filteredLogs.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <FaHistory className="text-5xl text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No audit logs found</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50">
                        <p className="text-gray-400 text-sm">
                            Showing {filteredLogs.length} log entries
                        </p>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                        {filteredLogs.map(log => {
                            const actionInfo = getActionInfo(log.action);
                            const IconComponent = actionInfo.icon;
                            
                            return (
                                <div 
                                    key={log.id}
                                    className="p-4 hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg bg-${actionInfo.color}-500/20`}>
                                            <IconComponent className={`text-${actionInfo.color}-400`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-sm font-medium text-${actionInfo.color}-400`}>
                                                    {actionInfo.label}
                                                </span>
                                                <span className="text-gray-500 text-sm">by</span>
                                                <span className="text-white font-medium">
                                                    {log.userName || 'System'}
                                                </span>
                                            </div>
                                            
                                            {/* Details */}
                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <div className="mt-2 text-sm text-gray-400">
                                                    {log.details.email && (
                                                        <span className="mr-4">Email: {log.details.email}</span>
                                                    )}
                                                    {log.details.collegeName && (
                                                        <span className="flex items-center gap-1 inline-flex">
                                                            <FaUniversity className="text-purple-400" />
                                                            {log.details.collegeName}
                                                        </span>
                                                    )}
                                                    {log.details.userName && (
                                                        <span className="mr-4">User: {log.details.userName}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-500 text-sm whitespace-nowrap">
                                                {formatDateTime(log.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuditLogsTab;
