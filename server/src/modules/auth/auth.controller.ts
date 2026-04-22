import type { Request, Response } from 'express';
import { authService } from './auth.service';

export const authController = {
  getMe: async (_req: Request, res: Response) => {
    const user = await authService.getCurrentUser();
    res.json({ user });
  },
};
