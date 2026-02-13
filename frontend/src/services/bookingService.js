import api from './api';

// ═══════════════════════════════════════════════════════
// BOOKING SERVICE
// ═══════════════════════════════════════════════════════

export const bookingService = {
    create: (data) => api.post('/bookings', data),
    getMyBookings: (params) => api.get('/bookings/my', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
    reschedule: (id, data) => api.patch(`/bookings/${id}/reschedule`, data),
    getAll: (params) => api.get('/bookings', { params }),
    assign: (id, technicianId) => api.patch(`/bookings/${id}/assign`, { technicianId }),
    updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
};

export default bookingService;
