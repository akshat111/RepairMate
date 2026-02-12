const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Health check endpoint
 * @route   GET /api/v1/health
 * @access  Public
 */
const getHealth = (req, res) => {
    ApiResponse.ok(res, 'Server is running 🚀', {
        environment: process.env.NODE_ENV,
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
    });
};

module.exports = { getHealth };
