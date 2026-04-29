import { z } from 'zod';
import { BIO_MAX_LENGTH, CHILD_ACCESS_CODE_LENGTH, USERNAME_REGEX } from '../constants/domain';

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

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  username: z.string().regex(USERNAME_REGEX).optional(),
  email: z.email().optional(),
  bio: z.string().max(BIO_MAX_LENGTH).nullable().optional(),
});

