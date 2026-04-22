import type { RequestHandler } from 'express';
import { verifyAccessToken } from '@/modules/auth/auth.tokens';
import { AppError } from '@/lib/errors';

export const authRequired: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
  }
};
