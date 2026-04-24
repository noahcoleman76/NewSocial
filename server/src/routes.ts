import type { Express } from 'express';
import express from 'express';
import { adminRouter } from '@/modules/admin/admin.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { connectionRouter } from '@/modules/connections/connection.routes';
import { familyRouter } from '@/modules/family/family.routes';
import { feedRouter } from '@/modules/feed/feed.routes';
import { notificationsRouter } from '@/modules/notifications/notifications.routes';
import { postsRouter } from '@/modules/posts/posts.routes';
import { reportsRouter } from '@/modules/reports/reports.routes';
import { usersRouter } from '@/modules/users/users.routes';

export const registerRoutes = (app: Express) => {
  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  api.use('/auth', authRouter);
  api.use('/connections', connectionRouter);
  api.use('/users', usersRouter);
  api.use('/feed', feedRouter);
  api.use('/posts', postsRouter);
  api.use('/reports', reportsRouter);
  api.use('/notifications', notificationsRouter);
  api.use('/family', familyRouter);
  api.use('/admin', adminRouter);

  app.use('/api', api);
};
