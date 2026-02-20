import { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import TechnicianDetailsModal from '../../components/TechnicianVerification/TechnicianDetailsModal';

// ═══════════════════════════════════════════════════════
// ADMIN TECHNICIANS
// ═══════════════════════════════════════════════════════

const FILTER_TABS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
];

const VerificationBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {status?.toUpperCase() || 'UNKNOWN'}
        </span>
    );
};

const OnlineDot = ({ isOnline }) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-300' : 'bg-slate-300'}`} />
);

const AdminTechnicians = () => {
    const [filter, setFilter] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState(null);

    const fetchTechnicians = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { limit: 50 };
            if (filter) params.status = filter;
            const { data } = await adminService.getAllTechnicians(params);
            const result = data?.data?.technicians || data?.data || [];
            setTechnicians(Array.isArray(result) ? result : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load technicians');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchTechnicians();
    }, [fetchTechnicians]);


    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Technicians</h2>
                <p className="text-sm text-slate-500 mt-1">Manage technician profiles and verification</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${filter === tab.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-icons text-red-500">error_outline</span>
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={fetchTechnicians} className="ml-auto text-sm font-medium text-red-600 hover:text-red-800">Retry</button>
                </div>
            )}

            {/* Technicians Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : technicians.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
                    <span className="material-icons text-5xl text-slate-300">person_search</span>
                    <p className="text-slate-500 mt-3 font-medium">No technicians found</p>
                    <p className="text-sm text-slate-400 mt-1">No technicians match the current filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {technicians.map((tech) => (
                        <div key={tech._id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                        {tech.user?.name?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{tech.user?.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500">{tech.user?.email || ''}</p>
                                    </div>
                                </div>
                                <VerificationBadge status={tech.verificationStatus} />
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm">
                                    <OnlineDot isOnline={tech.isOnline} />
                                    <span className={`font-medium ${tech.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {tech.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                    {tech.isAvailable && (
                                        <span className="ml-3 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Available</span>
                                    )}
                                </div>
                                {tech.specializations?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {tech.specializations.map((s, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium capitalize">{s}</span>
                                        ))}
                                    </div>
                                )}
                                {tech.experienceYears != null && (
                                    <p className="text-xs text-slate-500">{tech.experienceYears} years experience</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => setSelectedTechnician(tech)}
                                    className="w-full px-3 py-2 text-sm font-semibold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                                >
                                    View Details & Verify
                                </button>
                            </div>

                            {/* Rejection reason */}
                            {tech.verificationStatus === 'rejected' && tech.rejectionReason && (
                                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <p className="text-xs text-red-600"><span className="font-semibold">Reason:</span> {tech.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedTechnician && (
                <TechnicianDetailsModal
                    technician={selectedTechnician}
                    onClose={() => setSelectedTechnician(null)}
                    onUpdate={fetchTechnicians}
                />
            )}
        </div>
    );
};

export default AdminTechnicians;
