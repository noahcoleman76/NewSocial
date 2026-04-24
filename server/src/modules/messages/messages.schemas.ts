import { z } from 'zod';

const MESSAGE_MAX_LENGTH = 1000;

export const createConversationSchema = z.object({
  userId: z.string().min(1),
});

export const conversationParamsSchema = z.object({
  conversationId: z.string().min(1),
});

export const userParamsSchema = z.object({
  userId: z.string().min(1),
});

export const createMessageSchema = z.object({
  body: z.string().trim().max(MESSAGE_MAX_LENGTH).optional().or(z.literal('')),
});

