import rateLimit from 'express-rate-limit';

const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX = 25;

export const authRateLimit = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many authentication attempts. Please try again later.',
  },
});
