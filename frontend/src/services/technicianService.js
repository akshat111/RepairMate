import api from './api';

// ═══════════════════════════════════════════════════════
// TECHNICIAN SERVICE
// ═══════════════════════════════════════════════════════

const technicianService = {
    // ── Profile ──────────────────────────────────────────
    getMyProfile: () => api.get('/technicians/me'),

    // ── Assigned Bookings ────────────────────────────────
    getAssignedBookings: (params = {}) =>
        api.get('/bookings/assigned/me', { params }),

    // ── Job Actions ──────────────────────────────────────
    acceptJob: (bookingId) => api.patch(`/bookings/${bookingId}/accept`),
    rejectJob: (bookingId, reason) =>
        api.patch(`/bookings/${bookingId}/reject-assignment`, { reason }),
    startJob: (bookingId) => api.patch(`/bookings/${bookingId}/start`),
    completeJob: (bookingId, data = {}) =>
        api.patch(`/bookings/${bookingId}/complete`, data),

    // ── Earnings ─────────────────────────────────────────
    getEarningsDashboard: () => api.get('/earnings/dashboard'),
    getMyEarnings: (params = {}) =>
        api.get('/earnings/my', { params }),
};

export default technicianService;
