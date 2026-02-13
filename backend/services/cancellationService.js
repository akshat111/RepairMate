const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const Payment = require('../models/Payment');
const { processRefund } = require('./paymentService');
const { reverseEarning } = require('./earningsService');
const { bookingBus, BOOKING_EVENTS } = require('./bookingEvents');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════
// CANCELLATION SERVICE
// ═══════════════════════════════════════════════════════
//
// Orchestrates the full cancellation lifecycle:
//   1. State validation & role-based rules
//   2. Atomic booking status update
//   3. Payment refund (if paid)
//   4. Earnings reversal (if exists)
//   5. Technician availability release
//   6. Event emission
//
// Cancellation Matrix:
//   pending     → user ✓  admin ✓
//   assigned    → user ✓  admin ✓
//   in_progress → user ✗  admin ✓
//   completed   → ✗
//   cancelled   → ✗
// ═══════════════════════════════════════════════════════

const USER_CANCELLABLE = ['pending', 'assigned'];
const ADMIN_CANCELLABLE = ['pending', 'assigned', 'in_progress'];

/**
 * Cancel a booking with full financial cleanup.
 *
 * @param {string} bookingId
 * @param {Object} opts
 * @param {string} opts.cancelledBy   - User ObjectId performing the cancel
 * @param {string} opts.role          - 'user' | 'admin'
 * @param {string} [opts.reason]      - Cancellation reason
 * @returns {Promise<Object>} { booking, refund, earningReversed }
 */
const cancelBooking = async (bookingId, { cancelledBy, role, reason }) => {
    const allowedStatuses = role === 'admin' ? ADMIN_CANCELLABLE : USER_CANCELLABLE;
    const cancellationReason = reason || `Cancelled by ${role}`;

    // ── 1. Build query filter ─────────────────────────────
    const filter = {
        _id: bookingId,
        status: { $in: allowedStatuses },
    };

    // Users can only cancel their own bookings
    if (role === 'user') {
        filter.user = cancelledBy;
    }

    // ── 2. Atomic status update ───────────────────────────
    const booking = await Booking.findOneAndUpdate(
        filter,
        {
            $set: {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancellationReason,
            },
            $push: {
                statusHistory: {
                    status: 'cancelled',
                    changedBy: cancelledBy,
                    changedAt: new Date(),
                    note: cancellationReason,
                },
            },
        },
        { new: true }
    );

    if (!booking) {
        const exists = await Booking.findById(bookingId);
        if (!exists) throw new AppError('Booking not found', 404);
        if (role === 'user' && exists.user.toString() !== cancelledBy.toString()) {
            throw new AppError('Not authorized to cancel this booking', 403);
        }
        if (exists.status === 'cancelled') {
            throw new AppError('Booking is already cancelled', 409);
        }
        throw new AppError(
            `Cannot cancel a booking with status '${exists.status}'`,
            409
        );
    }

    const result = { booking, refund: null, earningReversed: false };

    // ── 3. Financial cleanup: Refund if paid ──────────────
    if (booking.isPaid || booking.paymentStatus === 'paid') {
        try {
            const completedPayment = await Payment.findOne({
                booking: bookingId,
                status: 'completed',
            });

            if (completedPayment) {
                const refundAmount = completedPayment.amount - completedPayment.refundedAmount;

                if (refundAmount > 0) {
                    const { payment: refundedPayment } = await processRefund({
                        paymentId: completedPayment._id,
                        amount: refundAmount,
                        reason: `Cancellation refund: ${cancellationReason}`,
                        processedBy: cancelledBy,
                    });

                    result.refund = {
                        paymentId: refundedPayment._id,
                        amount: refundAmount,
                        status: refundedPayment.status,
                    };

                    // Update booking payment status
                    await Booking.findByIdAndUpdate(bookingId, {
                        $set: { paymentStatus: 'refunded' },
                    });

                    logger.info('Cancellation refund processed', {
                        bookingId,
                        refundAmount,
                    });
                }
            }
        } catch (refundErr) {
            // Log but don't fail the cancellation — refunds can be retried
            logger.error('Cancellation refund failed', {
                bookingId,
                error: refundErr.message,
            });
        }
    }

    // ── 4. Earnings reversal (if exists) ──────────────────
    try {
        const reversed = await reverseEarning(bookingId);
        if (reversed) {
            result.earningReversed = true;
            logger.info('Earning reversed on cancellation', { bookingId });
        }
    } catch (earnErr) {
        logger.error('Earning reversal failed during cancellation', {
            bookingId,
            error: earnErr.message,
        });
    }

    // ── 5. Release technician availability ────────────────
    if (booking.technician) {
        try {
            await Technician.findByIdAndUpdate(booking.technician, {
                $set: { isAvailable: true },
            });
        } catch (techErr) {
            logger.warn('Failed to release technician availability', {
                bookingId,
                technicianId: booking.technician,
                error: techErr.message,
            });
        }
    }

    // ── 6. Emit cancellation event ────────────────────────
    const techDoc = booking.technician
        ? await Technician.findById(booking.technician)
        : null;

    bookingBus.emit(BOOKING_EVENTS.CANCELLED, {
        booking,
        userId: booking.user.toString(),
        technicianId: techDoc?.user?.toString() || null,
        changedBy: cancelledBy.toString(),
        previousStatus: booking.statusHistory[booking.statusHistory.length - 2]?.status || 'unknown',
        newStatus: 'cancelled',
    });

    logger.info('Booking cancelled', {
        bookingId,
        role,
        previousPaymentStatus: booking.paymentStatus,
        refunded: !!result.refund,
        earningReversed: result.earningReversed,
    });

    return result;
};

module.exports = { cancelBooking };
