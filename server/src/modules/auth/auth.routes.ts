import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.get('/me', asyncHandler(authController.getMe));
