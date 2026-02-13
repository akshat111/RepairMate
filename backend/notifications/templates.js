// ═══════════════════════════════════════════════════════
// NOTIFICATION TEMPLATES
// ═══════════════════════════════════════════════════════
//
// Human-readable templates for every notification type.
// Each template returns { subject, body } given a context
// object, making them reusable across channels (email,
// SMS, push, in-app).
// ═══════════════════════════════════════════════════════

const templates = {
    /**
     * Booking created — sent to the booking owner.
     */
    bookingCreated: (ctx) => ({
        subject: 'Booking Confirmed',
        body: `Your booking #${ctx.bookingId} for "${ctx.serviceType}" has been received. ${ctx.autoAssigned
                ? 'A technician has been auto-assigned!'
                : 'We are finding the best technician for you.'
            }`,
    }),

    /**
     * Booking created — sent to admins.
     */
    bookingCreatedAdmin: (ctx) => ({
        subject: 'New Booking Received',
        body: `A new booking #${ctx.bookingId} for "${ctx.serviceType}" was created by user ${ctx.userId}. Status: ${ctx.status}.`,
    }),

    /**
     * Technician assigned — sent to booking owner.
     */
    technicianAssignedUser: (ctx) => ({
        subject: 'Technician Assigned',
        body: `Great news! A technician has been assigned to your booking #${ctx.bookingId}. They will contact you soon.`,
    }),

    /**
     * Technician assigned — sent to the technician.
     */
    technicianAssignedTech: (ctx) => ({
        subject: 'New Assignment',
        body: `You have been assigned to booking #${ctx.bookingId} for "${ctx.serviceType}". Please review the details and prepare.`,
    }),

    /**
     * Booking started — sent to booking owner.
     */
    bookingStarted: (ctx) => ({
        subject: 'Repair In Progress',
        body: `Your repair for booking #${ctx.bookingId} has started. The technician is now working on your device.`,
    }),

    /**
     * Booking completed — sent to booking owner.
     */
    bookingCompleted: (ctx) => ({
        subject: 'Repair Completed',
        body: `Your repair for booking #${ctx.bookingId} has been completed successfully.${ctx.finalCost ? ` Final cost: ₹${ctx.finalCost}.` : ''
            }`,
    }),

    /**
     * Booking cancelled — sent to booking owner.
     */
    bookingCancelledUser: (ctx) => ({
        subject: 'Booking Cancelled',
        body: `Your booking #${ctx.bookingId} has been cancelled.${ctx.reason ? ` Reason: ${ctx.reason}` : ''
            }`,
    }),

    /**
     * Booking cancelled — sent to assigned technician.
     */
    bookingCancelledTech: (ctx) => ({
        subject: 'Booking Cancelled',
        body: `Booking #${ctx.bookingId} that was assigned to you has been cancelled.${ctx.reason ? ` Reason: ${ctx.reason}` : ''
            }`,
    }),

    /**
     * Generic status change — sent to booking owner.
     */
    statusChanged: (ctx) => ({
        subject: 'Booking Status Updated',
        body: `Your booking #${ctx.bookingId} status has been updated to "${ctx.newStatus}".`,
    }),
};

module.exports = templates;
