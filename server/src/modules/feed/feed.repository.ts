import { prisma } from '@/lib/prisma';

export const feedRepository = {
  listFeedPosts: (viewerId: string) =>
    prisma.post.findMany({
      where: {
        deletedAt: null,
        author: {
          accountStatus: 'ACTIVE',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            role: true,
          },
        },
        images: {
          select: {
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
            comments: true,
          },
        },
      },
    }),

  listActiveAds: () =>
    prisma.seedAdContent.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),
};
