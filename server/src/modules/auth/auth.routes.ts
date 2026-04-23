import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { validate } from '@/lib/validate';
import { authRequired } from '@/middleware/auth-required';
import { authController } from './auth.controller';
import { authRateLimit } from './auth.rate-limit';
import {
  changePasswordSchema,
  childFirstLoginSchema,
  childSetPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from './auth.schemas';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, validate(registerSchema), asyncHandler(authController.register));
authRouter.post('/login', authRateLimit, validate(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', authRateLimit, validate(refreshSchema), asyncHandler(authController.refresh));
authRouter.post('/logout', validate(refreshSchema), asyncHandler(authController.logout));
authRouter.post(
  '/child/first-login',
  authRateLimit,
  validate(childFirstLoginSchema),
  asyncHandler(authController.childFirstLogin),
);
authRouter.post(
  '/child/set-password',
  authRateLimit,
  validate(childSetPasswordSchema),
  asyncHandler(authController.childSetPassword),
);
authRouter.post(
  '/password/change',
  authRequired,
  authRateLimit,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
authRouter.get('/me', authRequired, asyncHandler(authController.getMe));
