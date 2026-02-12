const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to avoid Windows SRV resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connect to MongoDB using the URI from environment variables.
 * Includes a fallback for Windows systems where SRV lookups fail.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ── Mongoose connection event listeners ───────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

/**
 * Graceful shutdown — close the Mongoose connection before exiting.
 * Called automatically on SIGINT / SIGTERM in server.js.
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed');
};

module.exports = { connectDB, disconnectDB };
