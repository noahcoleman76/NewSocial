import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { authRequired } from '@/middleware/auth-required';
import { notificationsController } from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/', authRequired, asyncHandler(notificationsController.list));
notificationsRouter.delete('/', authRequired, asyncHandler(notificationsController.clearAll));
notificationsRouter.post('/:notificationId/read', authRequired, asyncHandler(notificationsController.markRead));
notificationsRouter.post('/read-all', authRequired, asyncHandler(notificationsController.markAllRead));

