import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { clearRefreshCookie, setRefreshCookie } from '@/modules/auth/auth.cookies';
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
  updateMe: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const user = await usersService.updateMe(req.auth.sub, req.body);
    res.json({ user });
  },
  applyFamilyCode: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const user = await usersService.applyFamilyCode(req.auth.sub, req.body.familyCode);
    res.json({ user });
  },
  updateProfileImage: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const file = Array.isArray(req.file) ? req.file[0] : req.file;
    const user = await usersService.updateProfileImage(req.auth.sub, file);
    res.json({ user });
  },
  deleteMe: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const result = await usersService.deleteMe(req.auth.sub, req.body.childOutcome);
    clearRefreshCookie(res);
    res.json(result);
  },  changePassword: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const result = await usersService.changePassword(req.auth.sub, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },
};

