const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════
// BOOKING EVENT BUS
// ═══════════════════════════════════════════════════════
//
// A lightweight, in-process event bus that decouples
// booking state changes from the notification layer.
//
// Controllers emit events here; the socket layer (or any
// other consumer — email, SMS, push) subscribes to them.
//
// This avoids importing socket.io directly in controllers.
// ═══════════════════════════════════════════════════════

/**
 * Event names (constants to avoid typos).
 */
const BOOKING_EVENTS = {
    CREATED: 'booking:created',
    ASSIGNED: 'booking:assigned',
    STARTED: 'booking:started',
    COMPLETED: 'booking:completed',
    CANCELLED: 'booking:cancelled',
    STATUS_CHANGED: 'booking:status_changed',
};

/**
 * Singleton event emitter for booking lifecycle events.
 *
 * Payload shape for all events:
 * {
 *   booking:      Booking document (lean or populated),
 *   userId:       ObjectId — the booking owner,
 *   technicianId: ObjectId | null — assigned technician user,
 *   changedBy:    ObjectId — who triggered the change,
 *   previousStatus: string | null,
 *   newStatus:    string,
 * }
 */
const bookingBus = new EventEmitter();

// Prevent warning when many listeners subscribe (e.g. in tests)
bookingBus.setMaxListeners(20);

module.exports = {
    bookingBus,
    BOOKING_EVENTS,
};
