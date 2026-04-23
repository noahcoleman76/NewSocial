import rateLimit from 'express-rate-limit';
import * as domainConstants from '../../../../shared/constants/domain';

const { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } = domainConstants;

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
