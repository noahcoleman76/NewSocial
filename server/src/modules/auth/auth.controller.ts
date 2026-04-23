import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { clearRefreshCookie, setRefreshCookie } from './auth.cookies';
import { authService } from './auth.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';

const getRefreshTokenFromRequest = (req: Request) => {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const fromBody = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined;
  return fromCookie ?? fromBody;
};

export const authController = {
  register: async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  refresh: async (req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new AppError('UNAUTHORIZED', 'Refresh token is required', 401);
    }

    const result = await authService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  logout: async (req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    res.status(204).send();
  },

  childFirstLogin: async (req: Request, res: Response) => {
    const result = await authService.childFirstLogin(req.body);
    res.json(result);
  },

  childSetPassword: async (req: Request, res: Response) => {
    const result = await authService.childSetPassword(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  changePassword: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const result = await authService.changePassword(req.auth.sub, req.body);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  getMe: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const user = await authService.getCurrentUser(req.auth.sub);
    res.json({ user });
  },
};
