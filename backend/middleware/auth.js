const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ═══════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════

/**
 * Protect routes — verify the access JWT and attach user to req.
 * Checks: token presence → signature → user existence → active → password not changed after token issued
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Extract token from header or cookie
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new AppError('Authentication required. Please log in.', 401);
    }

    // 2. Verify token signature and expiry
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AppError(
                'Your session has expired. Please refresh your token or log in again.',
                401
            );
        }
        throw new AppError('Invalid authentication token.', 401);
    }

    // 3. Ensure it's an access token (not a refresh token)
    if (decoded.type && decoded.type !== 'access') {
        throw new AppError('Invalid token type. Please use an access token.', 401);
    }

    // 4. Confirm user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
        throw new AppError('The user for this token no longer exists.', 401);
    }

    // 5. Check account is active
    if (!user.isActive) {
        throw new AppError('This account has been deactivated.', 401);
    }

    // 6. Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
        throw new AppError(
            'Password recently changed. Please log in again.',
            401
        );
    }

    req.user = user;
    next();
});

// ═══════════════════════════════════════════════════════
// ROLE-BASED AUTHORIZATION HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Generic role check — accepts any number of allowed roles.
 * Usage: authorize('admin', 'technician')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Authentication required before authorization.', 401);
        }
        if (!roles.includes(req.user.role)) {
            throw new AppError(
                `Access denied. Role '${req.user.role}' is not permitted for this action.`,
                403
            );
        }
        next();
    };
};

/**
 * Convenience helper — admin only.
 * Usage: router.patch('/approve', protect, adminOnly, controller)
 */
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        throw new AppError('Access denied. Admin privileges required.', 403);
    }
    next();
};

/**
 * Convenience helper — technician or admin.
 * Usage: router.get('/dashboard', protect, techOrAdmin, controller)
 */
const techOrAdmin = (req, res, next) => {
    if (!req.user || !['technician', 'admin'].includes(req.user.role)) {
        throw new AppError(
            'Access denied. Technician or admin privileges required.',
            403
        );
    }
    next();
};

module.exports = { protect, authorize, adminOnly, techOrAdmin };
