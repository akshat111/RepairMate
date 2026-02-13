const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

// Use Google DNS to avoid Windows SRV resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connect to MongoDB using the URI from environment variables.
 * Includes a fallback for Windows systems where SRV lookups fail.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info('MongoDB connected', { host: conn.connection.host });
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message });
    process.exit(1);
  }
};

// ── Mongoose connection event listeners ───────────────
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

/**
 * Graceful shutdown — close the Mongoose connection before exiting.
 * Called automatically on SIGINT / SIGTERM in server.js.
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

module.exports = { connectDB, disconnectDB };
