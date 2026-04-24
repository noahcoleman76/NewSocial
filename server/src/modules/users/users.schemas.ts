import { z } from 'zod';

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;
const BIO_MAX_LENGTH = 250;

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    username: z.string().trim().regex(USERNAME_REGEX).optional(),
    email: z.email().optional(),
    bio: z.string().max(BIO_MAX_LENGTH).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field must be provided',
  });

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

