const rateLimit = require('express-rate-limit');

// Helper to format rate limit errors
const limitHandler = (message) => {
  return (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: message || 'Too many requests from this IP, please try again later.'
    });
  };
};

// General rate limiter for all endpoints (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler('Too many requests. Please try again after 15 minutes.')
});

// Strict rate limiter for signup and login endpoints (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler('Too many login or registration attempts. Please try again after 15 minutes.')
});

// Strict rate limiter for forgot/reset password endpoints (5 requests per hour)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler('Too many password reset requests. Please try again after 1 hour.')
});

module.exports = {
  globalLimiter,
  authLimiter,
  passwordResetLimiter
};
