const rateLimit = require('express-rate-limit');

// Limiter for auth endpoints (login, register, forgot-password)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General limiter for all API endpoints
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
