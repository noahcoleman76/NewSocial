import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { authRequired } from '@/middleware/auth-required';
import { usersController } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/search', authRequired, asyncHandler(usersController.search));
usersRouter.get('/:username', authRequired, asyncHandler(usersController.getProfile));
