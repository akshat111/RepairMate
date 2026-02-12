// Load environment variables FIRST — before anything else
require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// ── Start server ──────────────────────────────────────
const startServer = async () => {
    try {
        // Wait for MongoDB connection before accepting requests
        await connectDB();

        app.listen(PORT, () => {
            console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`   Health check → http://localhost:${PORT}/api/v1/health\n`);
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
