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
  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: profileUserSelect,
    }),

  findByUsername: (username: string) =>
    prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        accountStatus: 'ACTIVE',
      },
      select: {
        ...profileUserSelect,
        children: {
          select: {
            id: true,
          },
        },
      },
    }),

  findAnyByUsername: (username: string) =>
    prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
      },
      select: {
        ...profileUserSelect,
        children: {
          select: {
            id: true,
          },
        },
      },
    }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      select: profileUserSelect,
    }),

  updateProfile: (
    userId: string,
    data: {
      displayName?: string;
      username?: string;
      email?: string;
      bio?: string | null;
    },
  ) =>
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.username !== undefined ? { username: data.username.toLowerCase() } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
      },
      select: {
        ...profileUserSelect,
        email: true,
        createdAt: true,
        children: {
          select: {
            id: true,
          },
        },
      },
    }),

  updateProfileImage: (userId: string, profileImageUrl: string | null) =>
    prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl },
      select: {
        ...profileUserSelect,
        email: true,
        createdAt: true,
        children: {
          select: {
            id: true,
          },
        },
      },
    }),


  findDeletionTarget: (userId: string) =>
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        children: {
          select: {
            id: true,
            role: true,
            parentId: true,
            accountStatus: true,
          },
        },
      },
    }),

  releaseChildren: (childIds: string[]) =>
    prisma.user.updateMany({
      where: {
        id: {
          in: childIds,
        },
        role: 'CHILD',
      },
      data: {
        role: 'STANDARD',
        parentId: null,
      },
    }),

  deleteUsersCompletely: async (userIds: string[]) =>
    prisma.$transaction(async (tx) => {
      const conversations = await tx.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: {
                in: userIds,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      const conversationIds = conversations.map((conversation) => conversation.id);

      if (conversationIds.length > 0) {
        await tx.conversation.deleteMany({
          where: {
            id: {
              in: conversationIds,
            },
          },
        });
      }

      await tx.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
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



