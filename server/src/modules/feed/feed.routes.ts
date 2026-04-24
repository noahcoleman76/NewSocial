import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { authRequired } from '@/middleware/auth-required';
import { feedController } from './feed.controller';

export const feedRouter = Router();

feedRouter.get('/', authRequired, asyncHandler(feedController.getFeed));
