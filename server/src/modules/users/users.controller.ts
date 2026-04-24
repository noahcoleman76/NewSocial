import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { usersService } from './users.service';

export const usersController = {
  search: async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const users = await usersService.searchUsers(req.auth.sub, q);
    res.json({ users });
  },
  getProfile: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const profile = await usersService.getProfile(req.auth.sub, username);
    res.json(profile);
  },
};
