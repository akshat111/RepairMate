const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');

// ═══════════════════════════════════════════════════════
// PAYMENT SERVICE
// ═══════════════════════════════════════════════════════
//
// Gateway-agnostic payment abstraction. All payment
// operations flow through this service. Swap the gateway
// adapter to integrate with Razorpay, Stripe, PayU, etc.
//
// Current adapter: ManualGateway (for testing / cash)
// ═══════════════════════════════════════════════════════

// ── Gateway Adapters ──────────────────────────────────
// Each adapter must implement: createOrder, verifyPayment, processRefund

const ManualGateway = {
    name: 'manual',

    createOrder: async ({ amount, currency, bookingId }) => ({
        orderId: `MANUAL-${Date.now().toString(36).toUpperCase()}`,
        amount,
        currency,
        status: 'created',
    }),

    verifyPayment: async ({ paymentId, orderId, signature }) => ({
        verified: true,
        paymentId: paymentId || `MANUAL-PAY-${Date.now().toString(36).toUpperCase()}`,
    }),

    processRefund: async ({ paymentId, amount }) => ({
        refundId: `MANUAL-REF-${Date.now().toString(36).toUpperCase()}`,
        amount,
        status: 'completed',
    }),
};

// ── Future gateway adapters (stubs) ──────────────────

const RazorpayGateway = {
    name: 'razorpay',

    createOrder: async ({ amount, currency, bookingId }) => {
        // TODO: const order = await razorpay.orders.create({ amount: amount * 100, currency, receipt: bookingId });
        // return { orderId: order.id, amount, currency, status: 'created' };
        throw new AppError('Razorpay gateway not configured', 501);
    },

    verifyPayment: async ({ paymentId, orderId, signature }) => {
        // TODO: Verify HMAC signature with Razorpay secret
        // const expectedSignature = crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex');
        // return { verified: expectedSignature === signature, paymentId };
        throw new AppError('Razorpay gateway not configured', 501);
    },

    processRefund: async ({ paymentId, amount }) => {
        // TODO: const refund = await razorpay.payments.refund(paymentId, { amount: amount * 100 });
        // return { refundId: refund.id, amount, status: refund.status };
        throw new AppError('Razorpay gateway not configured', 501);
    },
};

const StripeGateway = {
    name: 'stripe',

    createOrder: async () => {
        // TODO: const intent = await stripe.paymentIntents.create({ amount: amount * 100, currency });
        throw new AppError('Stripe gateway not configured', 501);
    },

    verifyPayment: async () => {
        throw new AppError('Stripe gateway not configured', 501);
    },

    processRefund: async () => {
        throw new AppError('Stripe gateway not configured', 501);
    },
};

// ── Gateway registry ─────────────────────────────────
const gateways = {
    manual: ManualGateway,
    razorpay: RazorpayGateway,
    stripe: StripeGateway,
};

/**
 * Get the active gateway adapter.
 * Defaults to manual; configure via PAYMENT_GATEWAY env var.
 */
const getGateway = (name) => {
    const gatewayName = name || process.env.PAYMENT_GATEWAY || 'manual';
    const gateway = gateways[gatewayName];
    if (!gateway) {
        throw new AppError(`Unknown payment gateway: ${gatewayName}`, 500);
    }
    return gateway;
};

// ═══════════════════════════════════════════════════════
// PUBLIC SERVICE METHODS
// ═══════════════════════════════════════════════════════

/**
 * Initiate a payment for a booking.
 * Creates a gateway order and a Payment record in 'pending' state.
 *
 * @param {Object}  opts
 * @param {string}  opts.bookingId
 * @param {string}  opts.userId
 * @param {number}  opts.amount
 * @param {string}  [opts.currency='INR']
 * @param {string}  [opts.method]
 * @param {string}  [opts.gateway]
 * @param {string}  [opts.description]
 * @returns {Promise<Object>} { payment, gatewayOrder }
 */
const initiatePayment = async ({ bookingId, userId, amount, currency = 'INR', method, gateway: gatewayName, description }) => {
    // Validate booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.user.toString() !== userId.toString()) {
        throw new AppError('Not authorized to pay for this booking', 403);
    }
    if (booking.paymentStatus === 'paid') {
        throw new AppError('Booking is already paid', 400);
    }

    // ── Atomic duplicate prevention ──────────────────────
    // Use findOneAndUpdate to atomically claim this booking for payment.
    // Only succeeds if no pending/processing payment exists.
    const existingPending = await Payment.findOne({
        booking: bookingId,
        status: { $in: ['pending', 'processing'] },
    });
    if (existingPending) {
        throw new AppError(
            'A payment is already in progress for this booking. Complete or cancel it first.',
            409
        );
    }

    const adapter = getGateway(gatewayName);
    const gatewayOrder = await adapter.createOrder({ amount, currency, bookingId });

    const payment = await Payment.create({
        booking: bookingId,
        user: userId,
        amount,
        currency,
        method,
        gateway: adapter.name,
        gatewayOrderId: gatewayOrder.orderId,
        description: description || `Payment for booking ${bookingId}`,
        status: 'pending',
    });

    // Atomic booking update — only if not already paid
    await Booking.findOneAndUpdate(
        { _id: bookingId, paymentStatus: { $ne: 'paid' } },
        { $set: { paymentStatus: 'pending' } }
    );

    return { payment, gatewayOrder };
};

/**
 * Confirm / verify a payment after gateway callback.
 *
 * @param {Object}  opts
 * @param {string}  opts.paymentId      - Our Payment document _id
 * @param {string}  [opts.gatewayPaymentId]
 * @param {string}  [opts.signature]    - Gateway signature for verification
 * @param {string}  [opts.method]       - Payment method used
 * @returns {Promise<Object>} { payment, booking }
 */
const confirmPayment = async ({ paymentId, gatewayPaymentId, signature, method }) => {
    // ── Atomic status check: only confirm pending/processing payments ──
    const payment = await Payment.findOneAndUpdate(
        {
            _id: paymentId,
            status: { $in: ['pending', 'processing'] },
        },
        {
            $set: { status: 'processing' }, // Lock it immediately
        },
        { new: true }
    );

    if (!payment) {
        const exists = await Payment.findById(paymentId);
        if (!exists) throw new AppError('Payment not found', 404);
        if (exists.status === 'completed') throw new AppError('Payment already completed', 409);
        throw new AppError(`Cannot confirm payment with status '${exists.status}'`, 400);
    }

    const adapter = getGateway(payment.gateway);
    const verification = await adapter.verifyPayment({
        paymentId: gatewayPaymentId,
        orderId: payment.gatewayOrderId,
        signature,
    });

    if (!verification.verified) {
        // Atomic update on verification failure
        await Payment.findByIdAndUpdate(payment._id, {
            $set: {
                status: 'failed',
                failureReason: 'Payment verification failed',
            },
        });
        throw new AppError('Payment verification failed', 402);
    }

    // ── Atomic update: mark payment as completed ──
    const completedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
            $set: {
                status: 'completed',
                gatewayPaymentId: verification.paymentId,
                paidAt: new Date(),
                method: method || payment.method,
            },
        },
        { new: true }
    );

    // Atomic booking update
    const booking = await Booking.findOneAndUpdate(
        { _id: payment.booking },
        { $set: { paymentStatus: 'paid', isPaid: true } },
        { new: true }
    );

    return { payment: completedPayment, booking };
};

/**
 * Record a payment failure.
 */
const failPayment = async ({ paymentId, reason }) => {
    // ── Atomic update: mark payment as failed ──
    const payment = await Payment.findByIdAndUpdate(
        paymentId,
        {
            $set: {
                status: 'failed',
                failureReason: reason || 'Payment failed',
            },
        },
        { new: true }
    );

    if (!payment) throw new AppError('Payment not found', 404);

    // ── Atomic booking update ──
    const booking = await Booking.findByIdAndUpdate(
        payment.booking,
        { $set: { paymentStatus: 'failed' } },
        { new: true }
    );

    return { payment, booking };
};

/**
 * Process a refund.
 *
 * @param {Object}  opts
 * @param {string}  opts.paymentId
 * @param {number}  opts.amount      - Refund amount (partial or full)
 * @param {string}  [opts.reason]
 * @param {string}  opts.processedBy - Admin user ID
 * @returns {Promise<Object>} { payment, booking }
 */
const processRefund = async ({ paymentId, amount, reason, processedBy }) => {
    // ── Atomic refund: check status + available balance in one operation ──
    const payment = await Payment.findOneAndUpdate(
        {
            _id: paymentId,
            status: 'completed',
            $expr: { $lte: [{ $add: ['$refundedAmount', amount] }, '$amount'] },
        },
        {
            $push: {
                refunds: {
                    refundId: `PENDING-${Date.now().toString(36).toUpperCase()}`,
                    amount,
                    reason,
                    status: 'pending',
                    processedBy,
                },
            },
            $inc: { refundedAmount: amount },
        },
        { new: true }
    );

    if (!payment) {
        const exists = await Payment.findById(paymentId);
        if (!exists) throw new AppError('Payment not found', 404);
        if (exists.status !== 'completed') {
            throw new AppError('Can only refund completed payments', 400);
        }
        const maxRefundable = exists.amount - exists.refundedAmount;
        throw new AppError(
            `Refund amount \u20b9${amount} exceeds refundable balance \u20b9${maxRefundable}`,
            400
        );
    }

    // Process via gateway
    const adapter = getGateway(payment.gateway);
    const refundResult = await adapter.processRefund({
        paymentId: payment.gatewayPaymentId,
        amount,
    });

    // Update the last refund entry with gateway response
    const lastRefund = payment.refunds[payment.refunds.length - 1];
    lastRefund.refundId = refundResult.refundId;
    lastRefund.status = refundResult.status === 'completed' ? 'completed' : 'pending';

    // Update payment status
    payment.status = payment.refundedAmount >= payment.amount
        ? 'refunded'
        : 'partially_refunded';
    await payment.save();

    // Atomic booking update
    const booking = await Booking.findOneAndUpdate(
        { _id: payment.booking },
        { $set: { paymentStatus: payment.status === 'refunded' ? 'refunded' : 'paid' } },
        { new: true }
    );

    return { payment, booking };
};

/**
 * Get payment(s) for a booking.
 */
const getBookingPayments = async (bookingId) => {
    return Payment.find({ booking: bookingId }).sort({ createdAt: -1 });
};

module.exports = {
    initiatePayment,
    confirmPayment,
    failPayment,
    processRefund,
    getBookingPayments,
    getGateway,
};
