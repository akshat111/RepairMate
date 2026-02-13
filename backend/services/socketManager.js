const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { bookingBus, BOOKING_EVENTS } = require('./bookingEvents');

// ═══════════════════════════════════════════════════════
// SOCKET.IO MANAGER
// ═══════════════════════════════════════════════════════
//
// Manages real-time connections, room subscriptions, and
// forwards booking events to the correct clients.
//
// Room strategy:
//   • user:<userId>          — personal room for booking owners
//   • tech:<userId>          — personal room for technicians
//   • booking:<bookingId>    — anyone involved in a specific booking
//   • admins                 — all admin users
// ═══════════════════════════════════════════════════════

let io = null;

/**
 * Initialize Socket.io and attach to the HTTP server.
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    // ── Authentication middleware ───────────────────────
    io.use((socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.query?.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.tokenType = decoded.type;
            next();
        } catch (err) {
            return next(new Error('Invalid or expired token'));
        }
    });

    // ── Connection handler ─────────────────────────────
    io.on('connection', (socket) => {
        const { userId } = socket;
        console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

        // Auto-join personal room
        socket.join(`user:${userId}`);

        // Client can request to join specific rooms
        socket.on('join:booking', (bookingId) => {
            socket.join(`booking:${bookingId}`);
        });

        socket.on('leave:booking', (bookingId) => {
            socket.leave(`booking:${bookingId}`);
        });

        // Technician joins their tech room
        socket.on('join:tech', () => {
            socket.join(`tech:${userId}`);
        });

        // Admin joins admin broadcast room
        socket.on('join:admin', () => {
            socket.join('admins');
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: ${userId} (${reason})`);
        });
    });

    // ── Subscribe to booking events ────────────────────
    registerBookingListeners();

    console.log('📡 Socket.io initialized');
    return io;
};

/**
 * Get the Socket.io server instance.
 * Throws if called before init.
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket() first.');
    }
    return io;
};

// ═══════════════════════════════════════════════════════
// BOOKING EVENT LISTENERS
// ═══════════════════════════════════════════════════════

const registerBookingListeners = () => {
    // ── New booking created ────────────────────────────
    bookingBus.on(BOOKING_EVENTS.CREATED, (payload) => {
        const { booking, userId } = payload;

        // Notify admins about new booking
        io.to('admins').emit('booking:created', {
            bookingId: booking._id,
            serviceType: booking.serviceType,
            status: booking.status,
            userId,
        });

        // If auto-assigned, also notify the technician
        if (payload.technicianId) {
            io.to(`tech:${payload.technicianId}`).emit('booking:assigned', {
                bookingId: booking._id,
                serviceType: booking.serviceType,
                message: 'You have been auto-assigned a new booking',
            });
        }
    });

    // ── Technician assigned ────────────────────────────
    bookingBus.on(BOOKING_EVENTS.ASSIGNED, (payload) => {
        const { booking, userId, technicianId } = payload;

        // Notify the booking owner
        io.to(`user:${userId}`).emit('booking:assigned', {
            bookingId: booking._id,
            message: 'A technician has been assigned to your booking',
            status: 'assigned',
        });

        // Notify the assigned technician
        if (technicianId) {
            io.to(`tech:${technicianId}`).emit('booking:assigned', {
                bookingId: booking._id,
                serviceType: booking.serviceType,
                message: 'You have been assigned a new booking',
            });
        }

        // Notify booking room
        io.to(`booking:${booking._id}`).emit('booking:updated', {
            bookingId: booking._id,
            status: 'assigned',
        });
    });

    // ── Booking started ────────────────────────────────
    bookingBus.on(BOOKING_EVENTS.STARTED, (payload) => {
        const { booking, userId } = payload;

        io.to(`user:${userId}`).emit('booking:started', {
            bookingId: booking._id,
            message: 'Your repair has started',
            status: 'in_progress',
        });

        io.to(`booking:${booking._id}`).emit('booking:updated', {
            bookingId: booking._id,
            status: 'in_progress',
        });
    });

    // ── Booking completed ──────────────────────────────
    bookingBus.on(BOOKING_EVENTS.COMPLETED, (payload) => {
        const { booking, userId } = payload;

        io.to(`user:${userId}`).emit('booking:completed', {
            bookingId: booking._id,
            message: 'Your repair has been completed',
            status: 'completed',
            finalCost: booking.finalCost,
        });

        io.to(`booking:${booking._id}`).emit('booking:updated', {
            bookingId: booking._id,
            status: 'completed',
        });
    });

    // ── Booking cancelled ──────────────────────────────
    bookingBus.on(BOOKING_EVENTS.CANCELLED, (payload) => {
        const { booking, userId, technicianId } = payload;

        io.to(`user:${userId}`).emit('booking:cancelled', {
            bookingId: booking._id,
            message: 'Your booking has been cancelled',
            reason: booking.cancellationReason,
        });

        if (technicianId) {
            io.to(`tech:${technicianId}`).emit('booking:cancelled', {
                bookingId: booking._id,
                message: 'A booking assigned to you has been cancelled',
            });
        }

        io.to(`booking:${booking._id}`).emit('booking:updated', {
            bookingId: booking._id,
            status: 'cancelled',
        });
    });

    // ── Generic status change (admin force-update) ─────
    bookingBus.on(BOOKING_EVENTS.STATUS_CHANGED, (payload) => {
        const { booking, userId, technicianId, newStatus } = payload;

        io.to(`user:${userId}`).emit('booking:status_changed', {
            bookingId: booking._id,
            status: newStatus,
            message: `Booking status updated to '${newStatus}'`,
        });

        if (technicianId) {
            io.to(`tech:${technicianId}`).emit('booking:status_changed', {
                bookingId: booking._id,
                status: newStatus,
            });
        }

        io.to(`booking:${booking._id}`).emit('booking:updated', {
            bookingId: booking._id,
            status: newStatus,
        });

        io.to('admins').emit('booking:status_changed', {
            bookingId: booking._id,
            status: newStatus,
            userId,
        });
    });
};

module.exports = { initSocket, getIO };
