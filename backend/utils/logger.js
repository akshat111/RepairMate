// ═══════════════════════════════════════════════════════
// STRUCTURED LOGGER
// ═══════════════════════════════════════════════════════
//
// Centralized, environment-aware logging utility.
//
// Levels: error > warn > info > debug
//
// In production:  error + warn + info only (no debug)
// In development: all levels + colorized + timestamps
// In test:        silent (unless LOG_LEVEL is set)
//
// Usage:
//   const logger = require('../utils/logger');
//   logger.info('Server started', { port: 5000 });
//   logger.error('DB failed', { error: err.message });
//   logger.warn('Deprecated route hit');
//   logger.debug('Query result', { data });
// ═══════════════════════════════════════════════════════

const LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const COLORS = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[90m', // Gray
    reset: '\x1b[0m',
};

const ICONS = {
    error: '❌',
    warn: '⚠️ ',
    info: 'ℹ️ ',
    debug: '🐛',
};

const env = process.env.NODE_ENV || 'development';
const isDev = env === 'development';
const isTest = env === 'test';

// Determine active log level
const getLogLevel = () => {
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel && LEVELS[envLevel] !== undefined) return LEVELS[envLevel];
    if (isTest) return -1; // Silent in test
    if (isDev) return LEVELS.debug;
    return LEVELS.info; // Production: info and above
};

const activeLevel = getLogLevel();

/**
 * Format a log entry.
 * Dev:  colorized with timestamp and icon
 * Prod: JSON for log aggregators (ELK, CloudWatch, etc.)
 */
const formatMessage = (level, message, meta) => {
    if (isDev) {
        const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
        const color = COLORS[level];
        const icon = ICONS[level];
        const metaStr = meta && Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : '';
        return `${color}[${time}] ${icon} ${level.toUpperCase()}${COLORS.reset}: ${message}${metaStr}`;
    }

    // Production: structured JSON
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(meta && Object.keys(meta).length ? { meta } : {}),
        env,
    });
};

/**
 * Core log function.
 */
const log = (level, message, meta = {}) => {
    if (LEVELS[level] > activeLevel) return;

    const formatted = formatMessage(level, message, meta);

    switch (level) {
        case 'error':
            process.stderr.write(formatted + '\n');
            break;
        case 'warn':
            process.stderr.write(formatted + '\n');
            break;
        default:
            process.stdout.write(formatted + '\n');
    }
};

// ── Public API ────────────────────────────────────────

const logger = {
    error: (message, meta) => log('error', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    info: (message, meta) => log('info', message, meta),
    debug: (message, meta) => log('debug', message, meta),

    /**
     * Log an HTTP request (for middleware use).
     */
    request: (req, statusCode, duration) => {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        log(level, `${req.method} ${req.originalUrl}`, {
            status: statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?._id?.toString(),
        });
    },
};

module.exports = logger;
