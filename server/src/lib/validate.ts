import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from './errors';

export const validate =
  <T>(schema: ZodType<T>, source: 'body' | 'params' | 'query' = 'body'): RequestHandler =>
  (req, _res, next) => {
    if (!schema) {
      return next(new AppError('SERVER_VALIDATION_MISCONFIGURED', 'Validation schema is missing', 500));
    }

    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      return next(new AppError('VALIDATION_ERROR', 'Request validation failed', 422, parsed.error.flatten()));
    }

    req[source] = parsed.data;
    next();
  };
