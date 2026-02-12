const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes — verify JWT and attach user to req.
 * Usage: router.get('/profile', protect, controller);
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Extract token from Authorization header or cookie
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        throw new AppError('Not authorized — no token provided', 401);
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user to request (exclude password)
    const user = await User.findById(decoded.id);

    if (!user) {
        throw new AppError('User belonging to this token no longer exists', 401);
    }

    if (!user.isActive) {
        throw new AppError('This account has been deactivated', 401);
    }

    req.user = user;
    next();
});

/**
 * Restrict access to specific roles.
 * Usage: router.delete('/user/:id', protect, authorize('admin'), controller);
 *
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new AppError(
                `Role '${req.user.role}' is not authorized to access this route`,
                403
            );
        }
        next();
    };
};

module.exports = { protect, authorize };
