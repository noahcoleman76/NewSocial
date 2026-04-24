import { z } from 'zod';

const COMMENT_MAX_LENGTH = 1000;

export const postParamsSchema = z.object({
  postId: z.string().min(1),
});

export const commentParamsSchema = z.object({
  postId: z.string().min(1),
  commentId: z.string().min(1),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(COMMENT_MAX_LENGTH),
});
