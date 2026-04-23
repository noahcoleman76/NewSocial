import type { CookieOptions, Response } from 'express';
import { env } from '@/config/env';
import { durationToMs } from '@/utils/duration';
import { REFRESH_COOKIE_NAME } from './auth.constants';

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: env.NODE_ENV === 'production' ? env.COOKIE_DOMAIN : undefined,
  path: '/',
});

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: durationToMs(env.JWT_REFRESH_TTL),
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
};
