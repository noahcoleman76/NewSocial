import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { postsService } from './posts.service';

const getPostId = (req: Request) => {
  const { postId } = req.params;

  return Array.isArray(postId) ? postId[0] : postId;
};

const getCommentId = (req: Request) => {
  const { commentId } = req.params;

  return Array.isArray(commentId) ? commentId[0] : commentId;
};

export const postsController = {
  createPost: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const post = await postsService.createPost({
      authorId: req.auth.sub,
      caption: typeof req.body.caption === 'string' ? req.body.caption : null,
      files,
    });

    res.status(201).json({ postId: post.id });
  },
  getPost: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const data = await postsService.getPost(req.auth.sub, getPostId(req));
    res.json(data);
  },
  deletePost: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await postsService.deletePost(req.auth.sub, getPostId(req));
    res.status(204).send();
  },
  likePost: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await postsService.likePost(req.auth.sub, getPostId(req));
    res.status(204).send();
  },
  unlikePost: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await postsService.unlikePost(req.auth.sub, getPostId(req));
    res.status(204).send();
  },
  listComments: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const comments = await postsService.listComments(req.auth.sub, getPostId(req));
    res.json({ comments });
  },
  createComment: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const comment = await postsService.createComment(req.auth.sub, getPostId(req), req.body.body);
    res.status(201).json({ comment });
  },
  deleteComment: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await postsService.deleteComment(req.auth.sub, getPostId(req), getCommentId(req));
    res.status(204).send();
  },
};
