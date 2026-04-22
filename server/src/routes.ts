import type { Express } from 'express';
import express from 'express';
import { adminRouter } from '@/modules/admin/admin.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { familyRouter } from '@/modules/family/family.routes';
import { feedRouter } from '@/modules/feed/feed.routes';
import { notificationsRouter } from '@/modules/notifications/notifications.routes';
import { usersRouter } from '@/modules/users/users.routes';

export const registerRoutes = (app: Express) => {
  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  api.use('/auth', authRouter);
  api.use('/users', usersRouter);
  api.use('/feed', feedRouter);
  api.use('/notifications', notificationsRouter);
  api.use('/family', familyRouter);
  api.use('/admin', adminRouter);

  app.use('/api', api);
};
