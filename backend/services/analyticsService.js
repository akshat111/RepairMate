const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Earning = require('../models/Earning');
const Technician = require('../models/Technician');

// ═══════════════════════════════════════════════════════
// ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════
//
// All analytics queries use MongoDB aggregation pipelines
// for server-side computation — no large datasets pulled
// into Node.js memory.
// ═══════════════════════════════════════════════════════

/**
 * Build a date filter for a given time range.
 * @param {string} period - 'today' | '7d' | '30d' | '90d' | '1y' | 'all'
 * @returns {Date|null}
 */
const getDateFrom = (period) => {
    const now = new Date();
    switch (period) {
        case 'today': return new Date(now.setHours(0, 0, 0, 0));
        case '7d': return new Date(now.setDate(now.getDate() - 7));
        case '30d': return new Date(now.setDate(now.getDate() - 30));
        case '90d': return new Date(now.setDate(now.getDate() - 90));
        case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
        case 'all': return null;
        default: return new Date(now.setDate(now.getDate() - 30)); // default 30d
    }
};

// ═══════════════════════════════════════════════════════
// REVENUE ANALYTICS
// ═══════════════════════════════════════════════════════

/**
 * Total revenue breakdown: estimated vs final vs collected.
 */
const getRevenueOverview = async (period = '30d') => {
    const dateFrom = getDateFrom(period);
    const match = dateFrom ? { createdAt: { $gte: dateFrom } } : {};

    const [revenue] = await Booking.aggregate([
        { $match: { ...match, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: null,
                totalEstimated: { $sum: '$estimatedCost' },
                totalFinal: {
                    $sum: { $ifNull: ['$finalCost', '$estimatedCost'] },
                },
                totalBookings: { $sum: 1 },
                completedRevenue: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalCost', '$estimatedCost'] }, 0],
                    },
                },
                avgBookingValue: {
                    $avg: { $ifNull: ['$finalCost', '$estimatedCost'] },
                },
            },
        },
    ]);

    // Payment collection stats
    const [payments] = await Payment.aggregate([
        { $match: { ...(dateFrom ? { createdAt: { $gte: dateFrom } } : {}), status: 'completed' } },
        {
            $group: {
                _id: null,
                totalCollected: { $sum: '$amount' },
                totalRefunded: { $sum: '$refundedAmount' },
                transactionCount: { $sum: 1 },
            },
        },
    ]);

    return {
        period,
        revenue: revenue || { totalEstimated: 0, totalFinal: 0, totalBookings: 0, completedRevenue: 0, avgBookingValue: 0 },
        collections: payments || { totalCollected: 0, totalRefunded: 0, transactionCount: 0 },
        netCollected: (payments?.totalCollected || 0) - (payments?.totalRefunded || 0),
    };
};

/**
 * Revenue trend — daily/weekly/monthly buckets.
 */
const getRevenueTrend = async (period = '30d', granularity = 'daily') => {
    const dateFrom = getDateFrom(period);
    const match = dateFrom
        ? { createdAt: { $gte: dateFrom }, status: 'completed' }
        : { status: 'completed' };

    const dateGroup = {
        daily: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' }, day: { $dayOfMonth: '$completedAt' } },
        weekly: { year: { $isoWeekYear: '$completedAt' }, week: { $isoWeek: '$completedAt' } },
        monthly: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
    };

    return Booking.aggregate([
        { $match: match },
        {
            $group: {
                _id: dateGroup[granularity] || dateGroup.daily,
                revenue: { $sum: { $ifNull: ['$finalCost', '$estimatedCost'] } },
                bookings: { $sum: 1 },
                avgValue: { $avg: { $ifNull: ['$finalCost', '$estimatedCost'] } },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);
};

// ═══════════════════════════════════════════════════════
// BOOKING ANALYTICS
// ═══════════════════════════════════════════════════════

/**
 * Booking metrics: counts by status, payment status, service type.
 */
const getBookingMetrics = async (period = '30d') => {
    const dateFrom = getDateFrom(period);
    const match = dateFrom ? { createdAt: { $gte: dateFrom } } : {};

    const [byStatus, byPayment, byService, byUrgency, avgCompletion] = await Promise.all([
        // Count by booking status
        Booking.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),

        // Count by payment status
        Booking.aggregate([
            { $match: match },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$finalCost', '$estimatedCost'] } } } },
            { $sort: { count: -1 } },
        ]),

        // Revenue by service type
        Booking.aggregate([
            { $match: { ...match, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: '$serviceType',
                    count: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ['$finalCost', '$estimatedCost'] } },
                    avgValue: { $avg: { $ifNull: ['$finalCost', '$estimatedCost'] } },
                },
            },
            { $sort: { revenue: -1 } },
        ]),

        // Count by urgency
        Booking.aggregate([
            { $match: match },
            { $group: { _id: '$urgency', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),

        // Average completion time (in hours)
        Booking.aggregate([
            { $match: { ...match, status: 'completed', startedAt: { $exists: true }, completedAt: { $exists: true } } },
            {
                $group: {
                    _id: null,
                    avgHours: {
                        $avg: {
                            $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60],
                        },
                    },
                    minHours: {
                        $min: {
                            $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60],
                        },
                    },
                    maxHours: {
                        $max: {
                            $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60],
                        },
                    },
                },
            },
        ]),
    ]);

    return {
        period,
        byStatus,
        byPaymentStatus: byPayment,
        byServiceType: byService,
        byUrgency,
        completionTime: avgCompletion[0] || { avgHours: 0, minHours: 0, maxHours: 0 },
    };
};

// ═══════════════════════════════════════════════════════
// TECHNICIAN PAYOUT ANALYTICS
// ═══════════════════════════════════════════════════════

/**
 * Technician payout summary + leaderboard.
 */
const getTechnicianPayouts = async (period = '30d') => {
    const dateFrom = getDateFrom(period);
    const match = dateFrom ? { createdAt: { $gte: dateFrom } } : {};

    const [overview, leaderboard] = await Promise.all([
        // Overall payout summary
        Earning.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalBookingAmount: { $sum: '$bookingAmount' },
                    totalCommission: { $sum: '$commissionAmount' },
                    totalNetPayouts: { $sum: '$netEarning' },
                    totalBonuses: { $sum: '$bonus' },
                    totalDeductions: { $sum: '$deductions' },
                    earningCount: { $sum: 1 },
                    pendingPayouts: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$netEarning', 0] },
                    },
                    approvedPayouts: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$netEarning', 0] },
                    },
                    paidPayouts: {
                        $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netEarning', 0] },
                    },
                },
            },
        ]),

        // Top technicians by earnings
        Earning.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$technicianUser',
                    totalEarnings: { $sum: '$netEarning' },
                    totalCommission: { $sum: '$commissionAmount' },
                    bookingsCompleted: { $sum: 1 },
                    avgEarning: { $avg: '$netEarning' },
                },
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { name: 1, email: 1 } }],
                },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        ]),
    ]);

    return {
        period,
        overview: overview[0] || {
            totalBookingAmount: 0, totalCommission: 0, totalNetPayouts: 0,
            totalBonuses: 0, totalDeductions: 0, earningCount: 0,
            pendingPayouts: 0, approvedPayouts: 0, paidPayouts: 0,
        },
        leaderboard,
    };
};

// ═══════════════════════════════════════════════════════
// COMBINED DASHBOARD
// ═══════════════════════════════════════════════════════

/**
 * Full admin dashboard — single API call for all key metrics.
 * Uses Promise.all for parallel aggregation.
 */
const getAdminDashboard = async (period = '30d') => {
    const [revenue, bookings, payouts, techStats] = await Promise.all([
        getRevenueOverview(period),
        getBookingMetrics(period),
        getTechnicianPayouts(period),
        // Quick technician stats
        Technician.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    verified: {
                        $sum: { $cond: [{ $eq: ['$verificationStatus', 'approved'] }, 1, 0] },
                    },
                    online: {
                        $sum: { $cond: [{ $eq: ['$isOnline', true] }, 1, 0] },
                    },
                    avgRating: { $avg: '$averageRating' },
                },
            },
        ]),
    ]);

    return {
        period,
        revenue,
        bookings,
        payouts,
        technicians: techStats[0] || { total: 0, verified: 0, online: 0, avgRating: 0 },
    };
};

module.exports = {
    getRevenueOverview,
    getRevenueTrend,
    getBookingMetrics,
    getTechnicianPayouts,
    getAdminDashboard,
};
