const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
    initiatePayment,
    confirmPayment,
    failPayment,
    processRefund,
    getBookingPayments,
} = require('../services/paymentService');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// ═══════════════════════════════════════════════════════
// USER ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Initiate payment for a booking
 * @route   POST /api/v1/payments/initiate
 * @access  Private (user)
 */
const initiate = asyncHandler(async (req, res) => {
    const { bookingId, amount, currency, method, gateway, description } = req.body;

    const { payment, gatewayOrder } = await initiatePayment({
        bookingId,
        userId: req.user._id,
        amount,
        currency,
        method,
        gateway,
        description,
    });

    res.status(201).json({
        success: true,
        message: 'Payment initiated',
        data: { payment, gatewayOrder },
    });
});

/**
 * @desc    Confirm / verify payment (after gateway callback)
 * @route   POST /api/v1/payments/confirm
 * @access  Private (user)
 */
const confirm = asyncHandler(async (req, res) => {
    const { paymentId, gatewayPaymentId, signature, method } = req.body;

    // ── Ownership guard: user can only confirm their own payments ──
    const paymentDoc = await Payment.findById(paymentId);
    if (!paymentDoc) throw new AppError('Payment not found', 404);
    if (paymentDoc.user.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to confirm this payment', 403);
    }

    const { payment, booking } = await confirmPayment({
        paymentId,
        gatewayPaymentId,
        signature,
        method,
    });

    res.status(200).json({
        success: true,
        message: 'Payment confirmed',
        data: { payment, booking },
    });
});

/**
 * @desc    Report a failed payment
 * @route   POST /api/v1/payments/fail
 * @access  Private (user)
 */
const fail = asyncHandler(async (req, res) => {
    const { paymentId, reason } = req.body;

    // ── Ownership guard: user can only fail their own payments ──
    const paymentDoc = await Payment.findById(paymentId);
    if (!paymentDoc) throw new AppError('Payment not found', 404);
    if (paymentDoc.user.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to modify this payment', 403);
    }

    const { payment } = await failPayment({ paymentId, reason });

    res.status(200).json({
        success: true,
        message: 'Payment failure recorded',
        data: { payment },
    });
});

/**
 * @desc    Get payments for a specific booking
 * @route   GET /api/v1/payments/booking/:bookingId
 * @access  Private (owner or admin)
 */
const getByBooking = asyncHandler(async (req, res) => {
    // ── Ownership guard: user can only see their own booking payments ──
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) throw new AppError('Booking not found', 404);
    if (
        req.user.role !== 'admin' &&
        booking.user.toString() !== req.user._id.toString()
    ) {
        throw new AppError('Not authorized to view payments for this booking', 403);
    }

    const payments = await getBookingPayments(req.params.bookingId);

    res.status(200).json({
        success: true,
        count: payments.length,
        data: { payments },
    });
});

/**
 * @desc    Get logged-in user's payment history
 * @route   GET /api/v1/payments/my
 * @access  Private (user)
 */
const getMyPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .populate('booking', 'serviceType status estimatedCost')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Payment.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: payments.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { payments },
    });
});

// ═══════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get all payments (admin)
 * @route   GET /api/v1/payments
 * @access  Private (admin)
 */
const getAll = asyncHandler(async (req, res) => {
    const { status, gateway, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .populate('user', 'name email')
            .populate('booking', 'serviceType status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Payment.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: payments.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { payments },
    });
});

/**
 * @desc    Process a refund (admin)
 * @route   POST /api/v1/payments/:id/refund
 * @access  Private (admin)
 */
const refund = asyncHandler(async (req, res) => {
    const { amount, reason } = req.body;

    const { payment, booking } = await processRefund({
        paymentId: req.params.id,
        amount,
        reason,
        processedBy: req.user._id,
    });

    res.status(200).json({
        success: true,
        message: `Refund of ₹${amount} processed`,
        data: { payment, booking },
    });
});

/**
 * @desc    Get single payment details (admin)
 * @route   GET /api/v1/payments/:id
 * @access  Private (admin)
 */
const getPayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('booking', 'serviceType status estimatedCost finalCost')
        .select('+gatewayResponse');

    if (!payment) {
        throw new AppError('Payment not found', 404);
    }

    res.status(200).json({
        success: true,
        data: { payment },
    });
});

module.exports = {
    initiate,
    confirm,
    fail,
    getByBooking,
    getMyPayments,
    getAll,
    refund,
    getPayment,
};
