// ═══════════════════════════════════════════════════════
// NOTIFICATION CHANNELS (Providers)
// ═══════════════════════════════════════════════════════
//
// Each channel exports a `send(notification)` function.
// Add new channels by creating a file and registering it
// in the channels array below.
//
// Notification shape:
// {
//   recipientId: string,          — User ObjectId
//   recipientEmail?: string,      — For email channel
//   recipientPhone?: string,      — For SMS channel
//   subject: string,
//   body: string,
//   type: string,                 — e.g. 'booking:assigned'
//   metadata?: object,            — Extra data for the channel
// }
// ═══════════════════════════════════════════════════════

const logger = require('../utils/logger');

/**
 * Console channel — logs notifications to stdout.
 * Active in all environments. Useful for debugging.
 */
const consoleChannel = {
    name: 'console',
    enabled: true,

    send: async (notification) => {
        logger.info('Notification dispatched', {
            type: notification.type,
            recipientId: notification.recipientId,
            subject: notification.subject,
        });

        if (process.env.NODE_ENV === 'development') {
            logger.debug('Notification body', { body: notification.body });
        }
    },
};

/**
 * In-app channel — stores notifications in the database.
 * Ready for frontend polling or socket delivery.
 */
const inAppChannel = {
    name: 'in-app',
    enabled: true,

    send: async (notification) => {
        // Lazy-load to avoid circular dependency at startup
        const Notification = require('../models/Notification');

        await Notification.create({
            user: notification.recipientId,
            type: notification.type,
            title: notification.subject,
            message: notification.body,
            metadata: notification.metadata || {},
        });
    },
};

/**
 * Email channel — stub for future integration.
 * Swap the send() body with Nodemailer / SendGrid / SES.
 */
const emailChannel = {
    name: 'email',
    enabled: false, // Enable when email provider is configured

    send: async (notification) => {
        // TODO: Integrate with email provider
        // Example:
        // await transporter.sendMail({
        //   to: notification.recipientEmail,
        //   subject: notification.subject,
        //   text: notification.body,
        // });
        logger.debug('Email stub sent', { to: notification.recipientEmail, subject: notification.subject });
    },
};

/**
 * SMS channel — stub for future integration.
 * Swap the send() body with Twilio / AWS SNS.
 */
const smsChannel = {
    name: 'sms',
    enabled: false, // Enable when SMS provider is configured

    send: async (notification) => {
        // TODO: Integrate with SMS provider
        // Example:
        // await twilioClient.messages.create({
        //   to: notification.recipientPhone,
        //   body: notification.body,
        // });
        logger.debug('SMS stub sent', { to: notification.recipientPhone, body: notification.body });
    },
};

/**
 * All registered channels.
 * The dispatcher iterates over enabled channels and calls send().
 */
const channels = [consoleChannel, inAppChannel, emailChannel, smsChannel];

module.exports = channels;
