const Earning = require('../models/Earning');
const Technician = require('../models/Technician');
const AppError = require('../utils/AppError');

// ═══════════════════════════════════════════════════════
// EARNINGS SERVICE
// ═══════════════════════════════════════════════════════
//
// Centralized earnings & commission logic. All financial
// calculations flow through this service.
//
// Commission tiers:
//   Default: 15% platform fee
//   Can be overridden per technician via commissionRate
//   or globally via PLATFORM_COMMISSION_RATE env var.
// ═══════════════════════════════════════════════════════

/**
 * Platform commission rate (0 to 1).
 * Override via PLATFORM_COMMISSION_RATE env var.
 */
const DEFAULT_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE) || 0.15;

/**
 * Tier-based commission rates.
 * Lower commission for high-performing technicians.
 */
const COMMISSION_TIERS = [
    { minRepairs: 100, rate: 0.10 },  // 10% for 100+ repairs
    { minRepairs: 50, rate: 0.12 },  // 12% for 50+ repairs
    { minRepairs: 20, rate: 0.13 },  // 13% for 20+ repairs
    { minRepairs: 0, rate: DEFAULT_COMMISSION_RATE },  // default
];

/**
 * Determine the commission rate for a technician.
 * Uses tier-based rates based on completed repairs.
 *
 * @param {Object} technician - Technician document
 * @returns {number} Commission rate (0 to 1)
 */
const getCommissionRate = (technician) => {
    // Allow per-technician override
    if (technician.commissionRate !== undefined && technician.commissionRate !== null) {
        return technician.commissionRate;
    }

    // Tier-based rate
    const repairs = technician.completedRepairs || 0;
    const tier = COMMISSION_TIERS.find((t) => repairs >= t.minRepairs);
    return tier ? tier.rate : DEFAULT_COMMISSION_RATE;
};

/**
 * Generate an earning record when a booking is completed.
 * Called from the booking completion flow.
 *
 * @param {Object}  opts
 * @param {Object}  opts.booking       - Completed booking document
 * @param {Object}  opts.technician    - Technician profile document
 * @param {string}  opts.techUserId    - Technician's user ID
 * @returns {Promise<Object>} Created earning document
 */
const generateEarning = async ({ booking, technician, techUserId }) => {
    // Only completed bookings generate earnings
    if (booking.status !== 'completed') {
        throw new AppError('Earnings can only be generated for completed bookings', 400);
    }

    const amount = booking.finalCost || booking.estimatedCost || 0;
    if (amount <= 0) {
        throw new AppError('Booking has no cost — cannot generate earnings', 400);
    }

    const commissionRate = getCommissionRate(technician);
    const commissionAmount = Math.round(amount * commissionRate);
    const netEarning = amount - commissionAmount;

    // ── Atomic upsert: prevents duplicate earnings even under concurrency ──
    // If a record for this booking already exists, returns it unchanged.
    // If not, creates a new one. The unique index on 'booking' is the safety net.
    const earning = await Earning.findOneAndUpdate(
        { booking: booking._id },
        {
            $setOnInsert: {
                technician: technician._id,
                technicianUser: techUserId,
                booking: booking._id,
                bookingAmount: amount,
                commissionRate,
                commissionAmount,
                netEarning,
                currency: booking.pricingBreakdown?.currency || 'INR',
                status: 'pending',
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Only increment completedRepairs if this was a new insert
    // (createdAt and updatedAt will be very close for new docs)
    const isNewInsert = earning.createdAt &&
        Math.abs(earning.createdAt.getTime() - earning.updatedAt.getTime()) < 1000;
    if (isNewInsert) {
        await Technician.findByIdAndUpdate(technician._id, {
            $inc: { completedRepairs: 1 },
        });
    }

    return earning;
};

/**
 * Reverse an earning when a booking is cancelled.
 * Only pending/approved earnings are auto-reversed.
 * Paid earnings require manual admin intervention.
 *
 * @param {string} bookingId
 * @returns {Promise<Object|null>} Reversed earning or null if none/not applicable
 */
const reverseEarning = async (bookingId) => {
    // Atomic: only reverse pending or approved earnings
    const earning = await Earning.findOneAndUpdate(
        {
            booking: bookingId,
            status: { $in: ['pending', 'approved'] },
        },
        {
            $set: {
                status: 'reversed',
                notes: `Reversed due to booking cancellation on ${new Date().toISOString()}`,
            },
        },
        { new: true }
    );

    if (!earning) {
        // Check if a paid earning exists — can't auto-reverse
        const paidEarning = await Earning.findOne({
            booking: bookingId,
            status: 'paid',
        });
        if (paidEarning) {
            const logger = require('../utils/logger');
            logger.warn('Paid earning cannot be auto-reversed', {
                bookingId,
                earningId: paidEarning._id,
            });
        }
        return null;
    }

    // Decrement technician's completed repairs count
    if (earning.technician) {
        await Technician.findByIdAndUpdate(earning.technician, {
            $inc: { completedRepairs: -1 },
        });
    }

    return earning;
};

/**
 * Get earnings summary / dashboard for a technician.
 *
 * @param {string} techUserId - Technician's user ObjectId
 * @returns {Promise<Object>} Dashboard stats
 */
const getEarningsDashboard = async (techUserId) => {
    const technician = await Technician.findOne({ user: techUserId });
    if (!technician) {
        throw new AppError('Technician profile not found', 404);
    }

    // Aggregation pipeline for summary stats
    const [summary] = await Earning.aggregate([
        { $match: { technicianUser: technician.user } },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$netEarning' },
                totalCommission: { $sum: '$commissionAmount' },
                totalBookingAmount: { $sum: '$bookingAmount' },
                totalBonus: { $sum: '$bonus' },
                totalDeductions: { $sum: '$deductions' },
                completedBookings: { $sum: 1 },
                pendingPayout: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'pending'] }, '$netEarning', 0],
                    },
                },
                approvedPayout: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'approved'] }, '$netEarning', 0],
                    },
                },
                paidOut: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'paid'] }, '$netEarning', 0],
                    },
                },
            },
        },
    ]);

    // Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await Earning.aggregate([
        {
            $match: {
                technicianUser: technician.user,
                createdAt: { $gte: sixMonthsAgo },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                earnings: { $sum: '$netEarning' },
                commission: { $sum: '$commissionAmount' },
                bookings: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);

    return {
        commissionRate: getCommissionRate(technician),
        summary: summary || {
            totalEarnings: 0,
            totalCommission: 0,
            totalBookingAmount: 0,
            totalBonus: 0,
            totalDeductions: 0,
            completedBookings: 0,
            pendingPayout: 0,
            approvedPayout: 0,
            paidOut: 0,
        },
        monthly,
    };
};

/**
 * Admin: get platform-wide earnings summary.
 */
const getPlatformSummary = async () => {
    const [summary] = await Earning.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$bookingAmount' },
                totalCommission: { $sum: '$commissionAmount' },
                totalTechPayouts: { $sum: '$netEarning' },
                totalBookings: { $sum: 1 },
                pendingPayouts: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['pending', 'approved']] }, '$netEarning', 0],
                    },
                },
                paidPayouts: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'paid'] }, '$netEarning', 0],
                    },
                },
            },
        },
    ]);

    return summary || {
        totalRevenue: 0,
        totalCommission: 0,
        totalTechPayouts: 0,
        totalBookings: 0,
        pendingPayouts: 0,
        paidPayouts: 0,
    };
};

module.exports = {
    generateEarning,
    reverseEarning,
    getEarningsDashboard,
    getPlatformSummary,
    getCommissionRate,
    COMMISSION_TIERS,
    DEFAULT_COMMISSION_RATE,
};
