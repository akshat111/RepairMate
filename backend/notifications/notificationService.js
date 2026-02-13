const channels = require('./channels');
const templates = require('./templates');
const { bookingBus, BOOKING_EVENTS } = require('../services/bookingEvents');

// ═══════════════════════════════════════════════════════
// NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════
//
// Central dispatcher that:
//   1. Listens to the booking event bus
//   2. Builds notifications from templates
//   3. Dispatches through all enabled channels
//
// To add a new event source, subscribe in registerListeners().
// To add a new channel, add it in channels.js.
// ═══════════════════════════════════════════════════════

/**
 * Dispatch a notification through all enabled channels.
 * Failures in one channel do not block others.
 *
 * @param {Object} notification
 * @param {string} notification.recipientId
 * @param {string} notification.subject
 * @param {string} notification.body
 * @param {string} notification.type
 */
const dispatch = async (notification) => {
    const enabledChannels = channels.filter((ch) => ch.enabled);

    const results = await Promise.allSettled(
        enabledChannels.map((ch) => ch.send(notification))
    );

    // Log any channel failures (don't throw — notifications are non-blocking)
    results.forEach((result, idx) => {
        if (result.status === 'rejected') {
            console.error(
                `⚠️  Notification channel "${enabledChannels[idx].name}" failed:`,
                result.reason?.message || result.reason
            );
        }
    });
};

/**
 * Send a notification to a specific user.
 */
const notifyUser = async (recipientId, type, template, context) => {
    const { subject, body } = template(context);
    await dispatch({
        recipientId,
        subject,
        body,
        type,
        metadata: context,
    });
};

// ═══════════════════════════════════════════════════════
// BOOKING EVENT LISTENERS
// ═══════════════════════════════════════════════════════

const registerListeners = () => {
    // ── Booking created ────────────────────────────────
    bookingBus.on(BOOKING_EVENTS.CREATED, async (payload) => {
        const ctx = {
            bookingId: payload.booking._id.toString(),
            serviceType: payload.booking.serviceType,
            status: payload.booking.status,
            userId: payload.userId,
            autoAssigned: !!payload.technicianId,
        };

        // Notify the booking owner
        await notifyUser(
            payload.userId,
            BOOKING_EVENTS.CREATED,
            templates.bookingCreated,
            ctx
        );

        // If auto-assigned, notify the technician
        if (payload.technicianId) {
            await notifyUser(
                payload.technicianId,
                BOOKING_EVENTS.ASSIGNED,
                templates.technicianAssignedTech,
                ctx
            );
        }
    });

    // ── Technician assigned (manual) ───────────────────
    bookingBus.on(BOOKING_EVENTS.ASSIGNED, async (payload) => {
        const ctx = {
            bookingId: payload.booking._id.toString(),
            serviceType: payload.booking.serviceType,
        };

        // Notify booking owner
        await notifyUser(
            payload.userId,
            BOOKING_EVENTS.ASSIGNED,
            templates.technicianAssignedUser,
            ctx
        );

        // Notify the technician
        if (payload.technicianId) {
            await notifyUser(
                payload.technicianId,
                BOOKING_EVENTS.ASSIGNED,
                templates.technicianAssignedTech,
                ctx
            );
        }
    });

    // ── Booking started ────────────────────────────────
    bookingBus.on(BOOKING_EVENTS.STARTED, async (payload) => {
        await notifyUser(
            payload.userId,
            BOOKING_EVENTS.STARTED,
            templates.bookingStarted,
            { bookingId: payload.booking._id.toString() }
        );
    });

    // ── Booking completed ──────────────────────────────
    bookingBus.on(BOOKING_EVENTS.COMPLETED, async (payload) => {
        await notifyUser(
            payload.userId,
            BOOKING_EVENTS.COMPLETED,
            templates.bookingCompleted,
            {
                bookingId: payload.booking._id.toString(),
                finalCost: payload.booking.finalCost,
            }
        );
    });

    // ── Booking cancelled ──────────────────────────────
    bookingBus.on(BOOKING_EVENTS.CANCELLED, async (payload) => {
        const ctx = {
            bookingId: payload.booking._id.toString(),
            reason: payload.booking.cancellationReason,
        };

        // Notify owner
        await notifyUser(
            payload.userId,
            BOOKING_EVENTS.CANCELLED,
            templates.bookingCancelledUser,
            ctx
        );

        // Notify technician if one was assigned
        if (payload.technicianId) {
            await notifyUser(
                payload.technicianId,
                BOOKING_EVENTS.CANCELLED,
                templates.bookingCancelledTech,
                ctx
            );
        }
    });

    // ── Generic status change (admin) ──────────────────
    bookingBus.on(BOOKING_EVENTS.STATUS_CHANGED, async (payload) => {
        await notifyUser(
            payload.userId,
            BOOKING_EVENTS.STATUS_CHANGED,
            templates.statusChanged,
            {
                bookingId: payload.booking._id.toString(),
                newStatus: payload.newStatus,
            }
        );
    });

    console.log('🔔 Notification service initialized');
};

module.exports = { dispatch, notifyUser, registerListeners };
