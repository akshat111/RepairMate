// Load environment variables FIRST — before anything else
require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./services/socketManager');
const { registerListeners: initNotifications } = require('./notifications/notificationService');

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
            console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`   Health check → http://localhost:${PORT}/api/v1/health`);
            console.log(`   WebSocket   → ws://localhost:${PORT}\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// ── Graceful shutdown ─────────────────────────────────
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    await disconnectDB();
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ── Global error safety nets ──────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
