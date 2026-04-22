import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service';

export const notificationsController = {
  list: async (_req: Request, res: Response) => {
    const notifications = await notificationsService.listNotifications();
    res.json({ notifications });
  },
};
