const asyncHandler = require('../utils/asyncHandler');
const {
    getRevenueOverview,
    getRevenueTrend,
    getBookingMetrics,
    getTechnicianPayouts,
    getAdminDashboard,
} = require('../services/analyticsService');

// ═══════════════════════════════════════════════════════
// ADMIN ANALYTICS ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Full admin dashboard (all key metrics)
 * @route   GET /api/v1/analytics/dashboard
 * @access  Private (admin)
 */
const dashboard = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;
    const data = await getAdminDashboard(period);

    res.status(200).json({ success: true, data });
});

/**
 * @desc    Revenue overview
 * @route   GET /api/v1/analytics/revenue
 * @access  Private (admin)
 */
const revenue = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;
    const data = await getRevenueOverview(period);

    res.status(200).json({ success: true, data });
});

/**
 * @desc    Revenue trend (daily/weekly/monthly)
 * @route   GET /api/v1/analytics/revenue/trend
 * @access  Private (admin)
 */
const revenueTrend = asyncHandler(async (req, res) => {
    const { period = '30d', granularity = 'daily' } = req.query;
    const data = await getRevenueTrend(period, granularity);

    res.status(200).json({ success: true, count: data.length, data });
});

/**
 * @desc    Booking metrics
 * @route   GET /api/v1/analytics/bookings
 * @access  Private (admin)
 */
const bookings = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;
    const data = await getBookingMetrics(period);

    res.status(200).json({ success: true, data });
});

/**
 * @desc    Technician payout analytics
 * @route   GET /api/v1/analytics/payouts
 * @access  Private (admin)
 */
const payouts = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;
    const data = await getTechnicianPayouts(period);

    res.status(200).json({ success: true, data });
});

module.exports = {
    dashboard,
    revenue,
    revenueTrend,
    bookings,
    payouts,
};
