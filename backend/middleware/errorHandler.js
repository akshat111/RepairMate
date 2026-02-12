const AppError = require('../utils/AppError');

/**
 * Centralized error-handling middleware
 * Must have 4 parameters so Express recognizes it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let error = { ...err, message: err.message };

    // Log the full error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // ── Mongoose: Bad ObjectId ──────────────────────────
    if (err.name === 'CastError') {
        error = new AppError(`Resource not found with id: ${err.value}`, 404);
    }

    // ── Mongoose: Duplicate key ─────────────────────────
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue).join(', ');
        error = new AppError(`Duplicate value entered for: ${field}`, 400);
    }

    // ── Mongoose: Validation error ──────────────────────
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        error = new AppError(messages.join('. '), 400);
    }

    // ── JSON Web Token errors (ready for auth) ─────────
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token. Please log in again.', 401);
    }
    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired. Please log in again.', 401);
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
