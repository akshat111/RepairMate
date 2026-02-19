import api from './api';

// ═══════════════════════════════════════════════════════
// ADMIN SERVICE
// ═══════════════════════════════════════════════════════
//
// All admin-only API calls. Uses the shared Axios
// instance which handles auth headers + token refresh.
// ═══════════════════════════════════════════════════════

// ── Analytics ─────────────────────────────────────────
const getDashboard = (period = '30d') =>
    api.get('/analytics/dashboard', { params: { period } });

const getRevenue = (period = '30d') =>
    api.get('/analytics/revenue', { params: { period } });

const getRevenueTrend = (period = '30d', granularity = 'daily') =>
    api.get('/analytics/revenue/trend', { params: { period, granularity } });

const getBookingStats = (period = '30d') =>
    api.get('/analytics/bookings', { params: { period } });

const getPayouts = (period = '30d') =>
    api.get('/analytics/payouts', { params: { period } });

// ── Booking Management ────────────────────────────────
const getAllBookings = (params = {}) =>
    api.get('/bookings', { params });

const assignTechnician = (bookingId, technicianId) =>
    api.patch(`/bookings/${bookingId}/assign`, { technicianId });

const updateBookingStatus = (bookingId, status, note) =>
    api.patch(`/bookings/${bookingId}/status`, { status, note });

const adminCancelBooking = (bookingId, reason) =>
    api.patch(`/bookings/${bookingId}/admin-cancel`, { reason });

const adminRescheduleBooking = (bookingId, data) =>
    api.patch(`/bookings/${bookingId}/admin-reschedule`, data);

// ── Technician Management ─────────────────────────────
const getAllTechnicians = (params = {}) =>
    api.get('/technicians', { params });

const getTechnician = (id) =>
    api.get(`/technicians/${id}`);

const approveTechnician = (id) =>
    api.patch(`/technicians/${id}/approve`);

const rejectTechnician = (id, reason) =>
    api.patch(`/technicians/${id}/reject`, { reason });

// ── User Management ──────────────────────────────────
const getCustomers = (params = {}) =>
    api.get('/admin/customers', { params });

const deleteCustomer = (id) =>
    api.delete(`/admin/customers/${id}`);

export default {
    getDashboard,
    getRevenue,
    getRevenueTrend,
    getBookingStats,
    getPayouts,
    getAllBookings,
    assignTechnician,
    updateBookingStatus,
    adminCancelBooking,
    adminRescheduleBooking,
    getAllTechnicians,
    getTechnician,
    approveTechnician,
    rejectTechnician,
    getCustomers,
    deleteCustomer,
};
