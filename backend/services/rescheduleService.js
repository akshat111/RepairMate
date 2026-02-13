const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const { calculatePrice } = require('./pricingService');
const { findBestMatch } = require('./technicianMatcher');
const { bookingBus, BOOKING_EVENTS } = require('./bookingEvents');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════
// RESCHEDULE SERVICE
// ═══════════════════════════════════════════════════════
//
// Handles booking rescheduling with:
//   1. State validation (only reschedule-able statuses)
//   2. Date/time slot update
//   3. Technician conflict detection & resolution
//   4. Price revalidation (urgency may change)
//   5. Rate-limiting (max reschedules per booking)
//
// Reschedule Matrix:
//   pending     → user ✓  admin ✓
//   assigned    → user ✓  admin ✓
//   in_progress → user ✗  admin ✓  (emergency only)
//   completed   → ✗
//   cancelled   → ✗
// ═══════════════════════════════════════════════════════

const USER_RESCHEDULABLE = ['pending', 'assigned'];
const ADMIN_RESCHEDULABLE = ['pending', 'assigned', 'in_progress'];
const MAX_RESCHEDULES = parseInt(process.env.MAX_RESCHEDULES, 10) || 3;

/**
 * Reschedule a booking.
 *
 * @param {string} bookingId
 * @param {Object} opts
 * @param {string} opts.rescheduledBy   - User ObjectId
 * @param {string} opts.role            - 'user' | 'admin'
 * @param {Date}   opts.newDate         - New preferred date
 * @param {string} [opts.newTimeSlot]   - 'morning' | 'afternoon' | 'evening'
 * @param {string} [opts.reason]        - Reschedule reason
 * @returns {Promise<Object>} { booking, priceChanged, technicianReassigned }
 */
const rescheduleBooking = async (bookingId, { rescheduledBy, role, newDate, newTimeSlot, reason }) => {
    // ── 1. Validate inputs ────────────────────────────────
    const parsedDate = new Date(newDate);
    if (isNaN(parsedDate.getTime())) {
        throw new AppError('Invalid date provided', 400);
    }
    if (parsedDate <= new Date()) {
        throw new AppError('Reschedule date must be in the future', 400);
    }

    const allowedStatuses = role === 'admin' ? ADMIN_RESCHEDULABLE : USER_RESCHEDULABLE;

    // ── 2. Fetch and validate booking ─────────────────────
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError('Booking not found', 404);

    // Ownership check for users
    if (role === 'user' && booking.user.toString() !== rescheduledBy.toString()) {
        throw new AppError('Not authorized to reschedule this booking', 403);
    }

    if (!allowedStatuses.includes(booking.status)) {
        throw new AppError(
            `Cannot reschedule a booking with status '${booking.status}'`,
            409
        );
    }

    // ── 3. Rate-limit reschedules ─────────────────────────
    const rescheduleCount = booking.rescheduleCount || 0;
    if (rescheduleCount >= MAX_RESCHEDULES) {
        throw new AppError(
            `Maximum reschedule limit (${MAX_RESCHEDULES}) reached. Please cancel and create a new booking.`,
            400
        );
    }

    const result = { priceChanged: false, technicianReassigned: false };

    // ── 4. Revalidate pricing if urgency context changes ──
    let newPricing = null;
    try {
        const priceResult = await calculatePrice({
            serviceType: booking.serviceType,
            issueType: booking.issueType,
            urgency: booking.urgency,
            preferredDate: parsedDate,
        });

        if (priceResult && priceResult.price !== booking.estimatedCost) {
            newPricing = priceResult;
            result.priceChanged = true;
        }
    } catch (priceErr) {
        // Non-fatal — keep original pricing
        logger.warn('Price revalidation failed during reschedule', {
            bookingId,
            error: priceErr.message,
        });
    }

    // ── 5. Check technician availability for new slot ─────
    let newTechnicianId = null;
    if (booking.technician && booking.status === 'assigned') {
        // Check if current technician has a conflict
        const conflict = await Booking.findOne({
            technician: booking.technician,
            _id: { $ne: bookingId },
            status: { $in: ['assigned', 'in_progress'] },
            preferredDate: parsedDate,
            ...(newTimeSlot ? { preferredTimeSlot: newTimeSlot } : {}),
        });

        if (conflict) {
            // Try to find a new technician
            try {
                const match = await findBestMatch({
                    serviceType: booking.serviceType,
                    issueType: booking.issueType,
                    urgency: booking.urgency,
                    preferredDate: parsedDate,
                    preferredTimeSlot: newTimeSlot || booking.preferredTimeSlot,
                });

                if (match) {
                    newTechnicianId = match._id;
                    result.technicianReassigned = true;

                    // Release old technician
                    await Technician.findByIdAndUpdate(booking.technician, {
                        $set: { isAvailable: true },
                    });
                } else {
                    throw new AppError(
                        'No technicians available for the new date/time. Please choose a different slot.',
                        409
                    );
                }
            } catch (matchErr) {
                if (matchErr instanceof AppError) throw matchErr;
                logger.warn('Technician rematch failed during reschedule', {
                    bookingId,
                    error: matchErr.message,
                });
                throw new AppError(
                    'Current technician unavailable for new slot and no alternative found',
                    409
                );
            }
        }
    }

    // ── 6. Atomic update ──────────────────────────────────
    const updateFields = {
        preferredDate: parsedDate,
        rescheduleCount: rescheduleCount + 1,
    };

    if (newTimeSlot) updateFields.preferredTimeSlot = newTimeSlot;
    if (newTechnicianId) updateFields.technician = newTechnicianId;
    if (newPricing) {
        updateFields.estimatedCost = newPricing.price;
        updateFields.pricingBreakdown = newPricing.breakdown || booking.pricingBreakdown;
    }

    const historyEntry = {
        status: booking.status, // Status doesn't change
        changedBy: rescheduledBy,
        changedAt: new Date(),
        note: `Rescheduled to ${parsedDate.toISOString().split('T')[0]}${newTimeSlot ? ` (${newTimeSlot})` : ''}${reason ? `: ${reason}` : ''}`,
    };

    const rescheduleEntry = {
        from: {
            date: booking.preferredDate,
            timeSlot: booking.preferredTimeSlot,
        },
        to: {
            date: parsedDate,
            timeSlot: newTimeSlot || booking.preferredTimeSlot,
        },
        reason: reason || 'Not specified',
        rescheduledBy,
        rescheduledAt: new Date(),
    };

    const updatedBooking = await Booking.findOneAndUpdate(
        {
            _id: bookingId,
            status: { $in: allowedStatuses },
        },
        {
            $set: updateFields,
            $push: {
                statusHistory: historyEntry,
                rescheduleHistory: rescheduleEntry,
            },
        },
        { new: true }
    );

    if (!updatedBooking) {
        throw new AppError(
            'Booking status changed during reschedule. Please try again.',
            409
        );
    }

    result.booking = updatedBooking;

    // ── 7. Emit event ─────────────────────────────────────
    bookingBus.emit(BOOKING_EVENTS.STATUS_CHANGED, {
        booking: updatedBooking,
        userId: updatedBooking.user.toString(),
        technicianId: newTechnicianId
            ? (await Technician.findById(newTechnicianId))?.user?.toString()
            : (booking.technician ? (await Technician.findById(booking.technician))?.user?.toString() : null),
        changedBy: rescheduledBy.toString(),
        previousStatus: booking.status,
        newStatus: `rescheduled (${booking.status})`,
    });

    logger.info('Booking rescheduled', {
        bookingId,
        oldDate: booking.preferredDate,
        newDate: parsedDate,
        priceChanged: result.priceChanged,
        technicianReassigned: result.technicianReassigned,
        rescheduleCount: rescheduleCount + 1,
    });

    return result;
};

module.exports = { rescheduleBooking };
