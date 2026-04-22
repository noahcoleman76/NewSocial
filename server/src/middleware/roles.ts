import type { RequestHandler } from 'express';
import type { UserRole } from '@shared/types/domain';
import { AppError } from '@/lib/errors';

export const requireRole = (...roles: UserRole[]): RequestHandler => (req, _res, next) => {
  if (!req.auth) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
  }

  if (!roles.includes(req.auth.role as UserRole)) {
    return next(new AppError('FORBIDDEN', 'You do not have permission for this action', 403));
  }

  next();
};
