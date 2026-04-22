import { z } from 'zod';
import { BIO_MAX_LENGTH, CHILD_ACCESS_CODE_LENGTH, USERNAME_REGEX } from '../constants/domain';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = z.object({
  email: z.email(),
  username: z.string().regex(USERNAME_REGEX),
  displayName: z.string().min(1).max(80),
  password: z.string().min(8).max(128),
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
