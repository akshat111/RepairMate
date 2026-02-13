import api from './api';

// ═══════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════

export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refreshToken: () => api.post('/auth/refresh-token'),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.patch('/auth/change-password', data),
};

export default authService;
