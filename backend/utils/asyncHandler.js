/**
 * Wraps an async route handler so that any rejected promise
 * is automatically forwarded to Express error-handling middleware.
 *
 * Usage:
 *   router.get('/example', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async Express route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
