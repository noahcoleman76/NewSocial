import { z } from 'zod';

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;
const CHILD_ACCESS_CODE_LENGTH = 8;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const registerSchema = z.object({
  email: z.email(),
  username: z.string().regex(USERNAME_REGEX),
  displayName: z.string().min(1).max(80),
  password: z.string().min(8).max(128),
  familyCode: z.string().trim().min(6).max(32).optional().or(z.literal('')),
});

export const childFirstLoginSchema = z.object({
  email: z.email(),
  code: z.string().length(CHILD_ACCESS_CODE_LENGTH),
});

export const childSetPasswordSchema = z.object({
  childToken: z.string().min(10),
  password: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
});

