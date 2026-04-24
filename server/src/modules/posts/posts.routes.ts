import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { validate } from '@/lib/validate';
import { authRequired } from '@/middleware/auth-required';
import { postUpload } from '@/modules/uploads/upload.middleware';
import { postsController } from './posts.controller';
import { commentParamsSchema, createCommentSchema, postParamsSchema } from './posts.schemas';

export const postsRouter = Router();

postsRouter.post('/', authRequired, postUpload.array('images', 5), asyncHandler(postsController.createPost));
postsRouter.get('/:postId', authRequired, validate(postParamsSchema, 'params'), asyncHandler(postsController.getPost));
postsRouter.delete(
  '/:postId',
  authRequired,
  validate(postParamsSchema, 'params'),
  asyncHandler(postsController.deletePost),
);
postsRouter.post(
  '/:postId/like',
  authRequired,
  validate(postParamsSchema, 'params'),
  asyncHandler(postsController.likePost),
);
postsRouter.delete(
  '/:postId/like',
  authRequired,
  validate(postParamsSchema, 'params'),
  asyncHandler(postsController.unlikePost),
);
postsRouter.get(
  '/:postId/comments',
  authRequired,
  validate(postParamsSchema, 'params'),
  asyncHandler(postsController.listComments),
);
postsRouter.post(
  '/:postId/comments',
  authRequired,
  validate(postParamsSchema, 'params'),
  validate(createCommentSchema),
  asyncHandler(postsController.createComment),
);
postsRouter.delete(
  '/:postId/comments/:commentId',
  authRequired,
  validate(commentParamsSchema, 'params'),
  asyncHandler(postsController.deleteComment),
);
