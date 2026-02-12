const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/jwt');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('An account with this email already exists', 400);
    }

    // Create user (password is hashed automatically via pre-save hook)
    const user = await User.create({ name, email, password, phone });

    sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    // Find user and explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
        throw new AppError('This account has been deactivated', 401);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    sendTokenResponse(user, 200, res);
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    // req.user is already set by the protect middleware
    res.status(200).json({
        success: true,
        data: { user: req.user },
    });
});

/**
 * @desc    Logout — clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    res
        .status(200)
        .cookie('token', 'none', {
            expires: new Date(Date.now() + 5 * 1000), // Expires in 5 seconds
            httpOnly: true,
        })
        .json({
            success: true,
            message: 'Logged out successfully',
        });
});

module.exports = { register, login, getMe, logout };
