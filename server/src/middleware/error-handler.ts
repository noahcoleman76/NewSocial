import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, isAppError } from '../lib/errors';

export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.flatten(),
    });
  }

  if (isAppError(error)) {
    return res.status(error.status).json({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  console.error(error);
  const fallback = new AppError('INTERNAL_ERROR', 'Unexpected server error', 500);
  void next;

  return res.status(fallback.status).json({
    code: fallback.code,
    message: fallback.message,
  });
};
