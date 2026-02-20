import { useState } from 'react';
import adminService from '../../services/adminService';

const TechnicianDetailsModal = ({ technician, onClose, onUpdate }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    if (!technician) return null;

    const { user, specializations, experienceYears, serviceArea, hourlyRate, verificationStatus, rejectionReason } = technician;

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await adminService.approveTechnician(technician._id);
            onUpdate();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            return alert('Please enter a rejection reason');
        }

        setActionLoading(true);
        try {
            await adminService.rejectTechnician(technician._id, rejectReason);
            onUpdate();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-900">Technician Profile</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                            <p className="text-slate-500">{user?.email}</p>
                            <p className="text-slate-500">{user?.phone || 'No phone'}</p>
                            <div className="mt-2 flex gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${verificationStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {verificationStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status Info if Rejected */}
                    {verificationStatus === 'rejected' && rejectionReason && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h4>
                            <p className="text-sm text-red-600">{rejectionReason}</p>
                        </div>
                    )}

                    {/* Professional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Professional Info</h4>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-slate-500">Experience</dt>
                                    <dd className="font-medium text-slate-900">{experienceYears} Years</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500">Hourly Rate</dt>
                                    <dd className="font-medium text-slate-900">₹{hourlyRate}/hr</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500">Service Area</dt>
                                    <dd className="font-medium text-slate-900">{serviceArea}</dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Specializations</h4>
                            <div className="flex flex-wrap gap-2">
                                {specializations?.map((spec, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Certifications (if any) */}
                    {technician.certifications?.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Certifications</h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                {technician.certifications.map((cert, i) => (
                                    <li key={i}>{cert.name} - {cert.issuedBy} ({cert.year})</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Documents (Placeholder) */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Documents</h4>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 border-dashed text-center text-slate-400 text-sm">
                            <span className="material-icons block mb-1">description</span>
                            No documents uploaded
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                    {verificationStatus === 'pending' ? (
                        <>
                            {showRejectInput ? (
                                <div className="flex-1 flex gap-2 animate-in fade-in slide-in-from-right-4">
                                    <input
                                        type="text"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => setShowRejectInput(false)}
                                        className="px-4 py-2 bg-white text-slate-600 border border-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowRejectInput(true)}
                                        className="px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Approving...' : 'Approve Application'}
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-slate-600 border border-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TechnicianDetailsModal;
