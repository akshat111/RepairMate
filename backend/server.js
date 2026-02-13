// Load environment variables FIRST — before anything else
require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./services/socketManager');
const { registerListeners: initNotifications } = require('./notifications/notificationService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// ── Start server ──────────────────────────────────────
const startServer = async () => {
    try {
        // Wait for MongoDB connection before accepting requests
        await connectDB();

        // Create HTTP server (required for Socket.io)
        const server = http.createServer(app);

        // Attach Socket.io to the HTTP server
        initSocket(server);

        // Initialize notification service (subscribes to booking events)
        initNotifications();

        server.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode`, { port: PORT, health: `http://localhost:${PORT}/api/v1/health`, websocket: `ws://localhost:${PORT}` });
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
};

startServer();

// ── Graceful shutdown ─────────────────────────────────
const gracefulShutdown = async (signal) => {
    logger.info('Graceful shutdown initiated', { signal });
    await disconnectDB();
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ── Global error safety nets ──────────────────────────
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { reason: reason?.message || reason });
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});
