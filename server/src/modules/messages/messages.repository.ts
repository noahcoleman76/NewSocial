import { prisma } from '@/lib/prisma';

const participantUserSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
  role: true,
  parentId: true,
  accountStatus: true,
} as const;

const messageInclude = {
  sender: {
    select: participantUserSelect,
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
} as const;

const conversationInclude = {
  participants: {
    include: {
      user: {
        select: participantUserSelect,
      },
    },
  },
  messages: {
    include: messageInclude,
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const;

export const messagesRepository = {
  findConversationById: (conversationId: string) =>
    prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    }),

  findConversationForUser: (conversationId: string, userId: string) =>
    prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId,
          },
          every: {
            user: {
              accountStatus: 'ACTIVE',
            },
          },
        },
      },
      include: conversationInclude,
    }),

  findMessageForUser: (messageId: string, userId: string) =>
    prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        ...messageInclude,
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: participantUserSelect,
                },
              },
            },
          },
        },
      },
    }),

  findMessageByIdWithConversation: (messageId: string) =>
    prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        ...messageInclude,
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: participantUserSelect,
                },
              },
            },
          },
        },
      },
    }),

  listContextMessages: (conversationId: string, anchorCreatedAt: Date) =>
    prisma.message.findMany({
      where: {
        conversationId,
        createdAt: {
          gte: new Date(anchorCreatedAt.getTime() - 1000 * 60 * 60 * 24),
          lte: new Date(anchorCreatedAt.getTime() + 1000 * 60 * 60 * 24),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 12,
      include: messageInclude,
    }),

  findConversationByDirectKey: (directKey: string) =>
    prisma.conversation.findUnique({
      where: { directKey },
      include: conversationInclude,
    }),

  createConversation: (data: { directKey: string; userIds: [string, string] }) =>
    prisma.conversation.create({
      data: {
        directKey: data.directKey,
        participants: {
          create: data.userIds.map((userId) => ({ userId })),
        },
      },
      include: conversationInclude,
    }),

  listConversationSummaries: (userId: string) =>
    prisma.conversationParticipant.findMany({
      where: {
        userId,
        conversation: {
          participants: {
            every: {
              user: {
                accountStatus: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: participantUserSelect,
                },
              },
            },
            messages: {
              include: messageInclude,
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    }),

  createMessage: (data: {
    conversationId: string;
    senderId: string;
    senderSnapshotName: string;
    body: string | null;
    imageUrls: string[];
  }) =>
    prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderSnapshotName: data.senderSnapshotName,
        body: data.body,
        images: {
          create: data.imageUrls.map((imageUrl, index) => ({
            imageUrl,
            sortOrder: index,
          })),
        },
      },
      include: messageInclude,
    }),

  touchConversation: (conversationId: string) =>
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
      },
    }),

  markConversationOpened: (conversationId: string, userId: string) =>
    prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastOpenedAt: new Date(),
      },
    }),
};


