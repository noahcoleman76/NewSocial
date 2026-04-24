import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { feedService } from './feed.service';

export const feedController = {
  getFeed: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const items = await feedService.getFeed(req.auth.sub);
    res.json({ items, endMessage: "You're caught up" });
  },
};
