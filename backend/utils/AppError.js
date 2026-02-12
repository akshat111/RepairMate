/**
 * Custom operational error class
 * Use this to throw known/expected errors that the error handler can process.
 */
class AppError extends Error {
    /**
     * @param {string} message - Human-readable error message
     * @param {number} statusCode - HTTP status code (default 500)
     */
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Distinguishes from programming errors

        // Capture the stack trace, omitting the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
