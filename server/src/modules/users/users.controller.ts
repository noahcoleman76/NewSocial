import type { Request, Response } from 'express';
import { usersService } from './users.service';

export const usersController = {
  search: async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const users = await usersService.searchUsers(q);
    res.json({ users });
  },
};
