import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { feedController } from './feed.controller';

export const feedRouter = Router();

feedRouter.get('/', asyncHandler(feedController.getFeed));
