import type { Request, Response } from 'express';
import { feedRepository } from './feed.repository';

export const feedController = {
  getFeed: async (_req: Request, res: Response) => {
    const items = await feedRepository.getFeed();
    res.json({ items, endMessage: "You're caught up" });
  },
};
