import { z } from 'zod';

export const createConnectionRequestSchema = z.object({
  receiverId: z.string().min(1),
});

export const connectionRequestParamsSchema = z.object({
  requestId: z.string().min(1),
});
