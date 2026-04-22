import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { notificationsController } from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/', asyncHandler(notificationsController.list));
