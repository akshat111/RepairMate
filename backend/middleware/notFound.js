const AppError = require('../utils/AppError');

/**
 * Catch-all middleware for undefined routes.
 * Must be mounted AFTER all other routes.
 */
const notFound = (req, res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
