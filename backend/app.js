const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Route & middleware imports
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// ── Initialize Express app ────────────────────────────
const app = express();

// ── Security middleware ───────────────────────────────
app.use(helmet()); // Set security-related HTTP headers
app.use(hpp()); // Prevent HTTP parameter pollution

// ── Rate limiting ─────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
});
app.use('/api', limiter);

// ── CORS ──────────────────────────────────────────────
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    })
);

// ── Body parsers & cookies ────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── HTTP request logger ───────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ── API routes ────────────────────────────────────────
app.use('/api/v1', routes);

// ── Error handling ────────────────────────────────────
app.use(notFound); // 404 catch-all
app.use(errorHandler); // Centralized error handler

module.exports = app;
