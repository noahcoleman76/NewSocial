import { prisma } from '@/lib/prisma';

const profileUserSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  profileImageUrl: true,
  role: true,
  parentId: true,
  accountStatus: true,
} as const;

export const usersRepository = {
  findByUsername: (username: string) =>
    prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        accountStatus: 'ACTIVE',
      },
      select: profileUserSelect,
    }),

  findPostsByAuthorId: (authorId: string, viewerId: string) =>
    prisma.post.findMany({
      where: {
        authorId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
            comments: true,
          },
        },
      },
    }),
};
