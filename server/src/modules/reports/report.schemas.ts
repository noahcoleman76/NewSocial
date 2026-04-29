import { z } from 'zod';

export const createReportSchema = z.object({
  targetType: z.enum(['POST', 'ACCOUNT']),
  targetId: z.string().min(1),
  reason: z.string().trim().min(1).max(200),
  message: z.string().trim().max(1000).optional(),
});

