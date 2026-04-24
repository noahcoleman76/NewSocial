import type { RequestHandler } from 'express';
import { authRepository } from '@/modules/auth/auth.repository';
import { AppError } from '@/lib/errors';

export const adminRequired: RequestHandler = async (req, _res, next) => {
  if (!req.auth?.sub) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
  }

  try {
    const user = await authRepository.findUserById(req.auth.sub);

    if (!user || user.role !== 'ADMIN' || user.accountStatus !== 'ACTIVE') {
      return next(new AppError('FORBIDDEN', 'Administrator access required', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};
