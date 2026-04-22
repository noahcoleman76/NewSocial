import { z } from 'zod';
import {
  CAPTION_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  POST_IMAGE_LIMIT,
  MESSAGE_IMAGE_LIMIT,
} from '../constants/domain';

export const createPostSchema = z.object({
  caption: z.string().max(CAPTION_MAX_LENGTH).nullable().optional(),
  imageUrls: z.array(z.string().min(1)).max(POST_IMAGE_LIMIT),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(COMMENT_MAX_LENGTH),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().max(MESSAGE_MAX_LENGTH).nullable().optional(),
  imageUrls: z.array(z.string().min(1)).max(MESSAGE_IMAGE_LIMIT).default([]),
});

export const reportSchema = z.object({
  targetType: z.enum(['POST', 'ACCOUNT', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(200),
  message: z.string().max(1000).nullable().optional(),
});
