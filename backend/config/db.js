const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI from environment variables.
 * Waits for a successful connection before the server starts listening.
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
