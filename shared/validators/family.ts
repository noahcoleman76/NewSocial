import { z } from 'zod';
import { USERNAME_REGEX } from '../constants/domain';

export const createChildSchema = z.object({
  email: z.email(),
  username: z.string().regex(USERNAME_REGEX),
  displayName: z.string().min(1).max(80),
});

export const parentDeleteSchema = z.object({
  outcome: z.enum(['DELETE_CHILDREN', 'RELEASE_CHILDREN']),
});
