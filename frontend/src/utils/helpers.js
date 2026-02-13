/**
 * Format a date string to a locale-friendly display.
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '';
    const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', { ...defaults, ...options });
};

/**
 * Format currency in INR.
 */
export const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Truncate text to a given length.
 */
export const truncate = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength) + '...';
};

/**
 * Extract a user-friendly error message from an API error.
 */
export const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    return error?.response?.data?.message || error?.message || 'Something went wrong';
};

/**
 * Friendly status badge mapping.
 */
export const STATUS_LABELS = {
    pending: 'Pending',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export const STATUS_COLORS = {
    pending: '#f59e0b',
    assigned: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#ef4444',
};
