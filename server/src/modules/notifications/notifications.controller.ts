import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { notificationsService } from './notifications.service';

export const notificationsController = {
  list: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const notifications = await notificationsService.listNotifications(req.auth.sub);
    res.json({ notifications });
  },
  markRead: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const notificationId = Array.isArray(req.params.notificationId) ? req.params.notificationId[0] : req.params.notificationId;
    const updated = await notificationsService.markRead(req.auth.sub, notificationId);

    if (!updated) {
      throw new AppError('NOTIFICATION_NOT_FOUND', 'Notification not found', 404);
    }

    res.status(204).send();
  },
  markAllRead: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await notificationsService.markAllRead(req.auth.sub);
    res.status(204).send();
  },
  clearAll: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await notificationsService.clearAll(req.auth.sub);
    res.status(204).send();
  },};



