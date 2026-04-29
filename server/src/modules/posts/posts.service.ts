import { AppError } from '@/lib/errors';
import { authRepository } from '@/modules/auth/auth.repository';
import { connectionRepository } from '@/modules/connections/connection.repository';
import { notificationsService } from '@/modules/notifications/notifications.service';
import { normalizeConnectionPair } from '@/modules/connections/connection.rules';
import { fileStorageService } from '@/modules/uploads/storage.service';
import type { Express } from 'express';
import { postsRepository } from './posts.repository';

const CAPTION_MAX_LENGTH = 1000;
const COMMENT_MAX_LENGTH = 1000;
const POST_IMAGE_LIMIT = 5;

const ensureActiveAccount = async (userId: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError('ACCOUNT_DISABLED', 'This account is not active', 403);
  }

  if (user.role === 'CHILD' && user.parent?.accountStatus !== 'ACTIVE') {
    throw new AppError('ACCOUNT_DISABLED', 'This child account requires an active family manager', 403);
  }

  return user;
};

const ensurePostVisible = async (viewer: Awaited<ReturnType<typeof ensureActiveAccount>>, authorId: string) => {
  if (viewer.role === 'ADMIN') {
    return true;
  }

  if (viewer.id === authorId) {
    return true;
  }

  const familyRelation = await connectionRepository.findDirectFamilyRelation(viewer.id, authorId);
  if (familyRelation) {
    return true;
  }

  const [userAId, userBId] = normalizeConnectionPair(viewer.id, authorId);
  const connection = await connectionRepository.findConnectionByUsers(userAId, userBId);

  if (!connection || connection.status !== 'ACTIVE') {
    throw new AppError('FORBIDDEN', 'This post is not visible to you', 403);
  }

  return true;
};

const mapPost = (post: NonNullable<Awaited<ReturnType<typeof postsRepository.findPostById>>>) => ({
  id: post.id,
  createdAt: post.createdAt,
  author: {
    id: post.author.id,
    username: post.author.username,
    displayName: post.author.displayName,
    profileImageUrl: post.author.profileImageUrl,
    isFamilyLinked: post.author.role === 'CHILD' || Boolean(post.author.parentId),
  },
  caption: post.caption,
  images: post.images.map((image) => image.imageUrl),
  likeCount: post._count.likes,
  likedByMe: post.likes.length > 0,
  commentCount: post._count.comments,
});

const mapComment = (
  comment:
    | Awaited<ReturnType<typeof postsRepository.createComment>>
    | NonNullable<Awaited<ReturnType<typeof postsRepository.listCommentsByPostId>>>[number],
  viewerId: string,
  postOwnerId: string,
) => ({
  id: comment.id,
  body: comment.body,
  createdAt: comment.createdAt,
  author: {
    id: comment.author.id,
    username: comment.author.username,
    displayName: comment.author.displayName,
    profileImageUrl: comment.author.profileImageUrl,
  },
  canDelete: comment.authorId === viewerId || postOwnerId === viewerId,
});

export const postsService = {
  createPost: async ({
    authorId,
    caption,
    files,
  }: {
    authorId: string;
    caption?: string | null;
    files: Express.Multer.File[];
  }) => {
    await ensureActiveAccount(authorId);

    const normalizedCaption = caption?.trim() ? caption.trim() : null;

    if (!normalizedCaption && files.length === 0) {
      throw new AppError('POST_CONTENT_REQUIRED', 'Add text, images, or both to create a post', 422);
    }

    if (normalizedCaption && normalizedCaption.length > CAPTION_MAX_LENGTH) {
      throw new AppError('CAPTION_TOO_LONG', `Caption must be ${CAPTION_MAX_LENGTH} characters or fewer`, 422);
    }

    if (files.length > POST_IMAGE_LIMIT) {
      throw new AppError('TOO_MANY_IMAGES', `Posts can include up to ${POST_IMAGE_LIMIT} images`, 422);
    }

    const imageUrls = await Promise.all(files.map((file) => fileStorageService.saveImage(file, 'posts')));

    return postsRepository.createPost({
      authorId,
      caption: normalizedCaption,
      imageUrls,
    });
  },

  getPost: async (viewerId: string, postId: string) => {
    const viewer = await ensureActiveAccount(viewerId);

    const post = await postsRepository.findPostById(postId, viewerId);
    if (!post || post.author.accountStatus !== 'ACTIVE') {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await ensurePostVisible(viewer, post.author.id);

    const comments = await postsRepository.listCommentsByPostId(postId);

    return {
      post: {
        ...mapPost(post),
        canDelete: post.author.id === viewerId,
      },
      comments: comments.map((comment) => mapComment(comment, viewerId, post.author.id)),
    };
  },

  likePost: async (viewerId: string, postId: string) => {
    const viewer = await ensureActiveAccount(viewerId);

    const post = await postsRepository.findPostById(postId, viewerId);
    if (!post || post.author.accountStatus !== 'ACTIVE') {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await ensurePostVisible(viewer, post.author.id);
    await postsRepository.createLike(postId, viewerId);
  },

  unlikePost: async (viewerId: string, postId: string) => {
    const viewer = await ensureActiveAccount(viewerId);

    const post = await postsRepository.findPostById(postId, viewerId);
    if (!post || post.author.accountStatus !== 'ACTIVE') {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await ensurePostVisible(viewer, post.author.id);
    await postsRepository.deleteLike(postId, viewerId);
  },

  listComments: async (viewerId: string, postId: string) => {
    const viewer = await ensureActiveAccount(viewerId);

    const post = await postsRepository.findPostById(postId, viewerId);
    if (!post || post.author.accountStatus !== 'ACTIVE') {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await ensurePostVisible(viewer, post.author.id);

    const comments = await postsRepository.listCommentsByPostId(postId);
    return comments.map((comment) => mapComment(comment, viewerId, post.author.id));
  },

  createComment: async (viewerId: string, postId: string, body: string) => {
    const viewer = await ensureActiveAccount(viewerId);

    const normalizedBody = body.trim();
    if (!normalizedBody) {
      throw new AppError('COMMENT_REQUIRED', 'Comment text is required', 422);
    }

    if (normalizedBody.length > COMMENT_MAX_LENGTH) {
      throw new AppError('COMMENT_TOO_LONG', `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer`, 422);
    }

    const post = await postsRepository.findPostById(postId, viewerId);
    if (!post || post.author.accountStatus !== 'ACTIVE') {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await ensurePostVisible(viewer, post.author.id);
    const comment = await postsRepository.createComment(postId, viewerId, normalizedBody);

    if (post.author.id !== viewerId) {
      await notificationsService.createNotification({
        userId: post.author.id,
        type: 'POST_COMMENT',
        entityType: 'POST',
        entityId: post.id,
      });
    }

    return mapComment(comment, viewerId, post.author.id);
  },

  deleteComment: async (viewerId: string, postId: string, commentId: string) => {
    const viewer = await ensureActiveAccount(viewerId);

    const post = await postsRepository.findPostById(postId, viewerId);
    if (!post || post.author.accountStatus !== 'ACTIVE') {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await ensurePostVisible(viewer, post.author.id);

    const comment = await postsRepository.findCommentById(commentId);
    if (!comment || comment.post.id !== postId) {
      throw new AppError('COMMENT_NOT_FOUND', 'Comment not found', 404);
    }

    if (comment.authorId !== viewerId && comment.post.authorId !== viewerId) {
      throw new AppError('FORBIDDEN', 'You cannot delete this comment', 403);
    }

    await postsRepository.deleteComment(commentId);
  },

  deletePost: async (viewerId: string, postId: string) => {
    const viewer = await ensureActiveAccount(viewerId);

    const post = await postsRepository.findPostById(postId, viewerId);
    if (!post || post.author.accountStatus !== 'ACTIVE') {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    if (post.author.id !== viewerId) {
      throw new AppError('FORBIDDEN', 'You can only delete your own posts', 403);
    }

    await postsRepository.deletePost(postId);
  },
};


