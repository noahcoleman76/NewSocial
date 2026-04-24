import { prisma } from '@/lib/prisma';

export const postsRepository = {
  createPost: (data: { authorId: string; caption: string | null; imageUrls: string[] }) =>
    prisma.post.create({
      data: {
        authorId: data.authorId,
        caption: data.caption,
        images: {
          create: data.imageUrls.map((imageUrl, index) => ({
            imageUrl,
            sortOrder: index,
          })),
        },
      },
    }),

  findPostById: (postId: string, viewerId: string) =>
    prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            role: true,
            parentId: true,
            accountStatus: true,
          },
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        likes: {
          where: {
            userId: viewerId,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    }),

  listCommentsByPostId: (postId: string) =>
    prisma.comment.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
      },
    }),

  createLike: (postId: string, userId: string) =>
    prisma.postLike.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      create: {
        postId,
        userId,
      },
      update: {},
    }),

  deleteLike: (postId: string, userId: string) =>
    prisma.postLike.deleteMany({
      where: {
        postId,
        userId,
      },
    }),

  createComment: (postId: string, authorId: string, body: string) =>
    prisma.comment.create({
      data: {
        postId,
        authorId,
        body,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
      },
    }),

  findCommentById: (commentId: string) =>
    prisma.comment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
      include: {
        post: {
          select: {
            id: true,
            authorId: true,
          },
        },
      },
    }),

  deleteComment: (commentId: string) =>
    prisma.comment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
      },
    }),

  deletePost: (postId: string) =>
    prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
      },
    }),
};
