const rateLimit = require("express-rate-limit");

/**
 * Creates a rate limiter middleware.
 *
 * @param {Object} options
 * @param {number}  options.windowMs      - Time window in milliseconds (default: 15 min)
 * @param {number}  options.max           - Max requests per window (default: 100)
 * @param {string}  [options.message]     - Custom error message
 * @param {boolean} [options.skipSuccess] - Skip counting successful responses (default: false)
 */
const createLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests, please try again later.",
  skipSuccess = false,
} = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccess,
    handler: (req, res) => {
      res.status(429).json({ success: false, message });
    },
  });

// ─── Preset limiters ──────────────────────────────────────────────────────────

// Strict: login / signup — 10 attempts per 15 min
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many auth attempts. Please wait 15 minutes before trying again.",
});

// OTP / forgot password — 5 per 10 min (prevent OTP spam)
const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many reset requests. Please wait 10 minutes.",
});

// General API — 200 per 15 min
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP.",
});

// Write operations (POST/PUT/DELETE) — 60 per 15 min
const writeLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many write requests. Please slow down.",
});

// Admin endpoints — 300 per 15 min
const adminLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many admin requests.",
});

module.exports = { createLimiter, authLimiter, otpLimiter, apiLimiter, writeLimiter, adminLimiter };
