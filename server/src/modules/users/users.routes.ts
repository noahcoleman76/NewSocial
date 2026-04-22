import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { usersController } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/search', asyncHandler(usersController.search));
