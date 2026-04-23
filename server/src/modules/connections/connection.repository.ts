import { prisma } from '@/lib/prisma';

const relationshipUserSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
  role: true,
  parentId: true,
  accountStatus: true,
} as const;

export const connectionRepository = {
  searchUsers: (requesterId: string, query: string) =>
    prisma.user.findMany({
      where: {
        id: {
          not: requesterId,
        },
        accountStatus: 'ACTIVE',
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            displayName: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: [{ displayName: 'asc' }, { username: 'asc' }],
      take: 20,
      select: {
        ...relationshipUserSelect,
        incomingRequests: {
          where: {
            senderId: requesterId,
            status: 'PENDING',
          },
          select: {
            id: true,
          },
        },
        outgoingRequests: {
          where: {
            receiverId: requesterId,
            status: 'PENDING',
          },
          select: {
            id: true,
          },
        },
        connectionsA: {
          where: {
            userBId: requesterId,
            status: {
              in: ['ACTIVE', 'PENDING_MANAGER_APPROVAL'],
            },
          },
          select: {
            id: true,
            status: true,
          },
        },
        connectionsB: {
          where: {
            userAId: requesterId,
            status: {
              in: ['ACTIVE', 'PENDING_MANAGER_APPROVAL'],
            },
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),

  listActiveConnections: (userId: string) =>
    prisma.connection.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        userA: {
          select: relationshipUserSelect,
        },
        userB: {
          select: relationshipUserSelect,
        },
      },
    }),

  listPendingApprovalConnections: (userId: string) =>
    prisma.connection.findMany({
      where: {
        status: 'PENDING_MANAGER_APPROVAL',
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        userA: {
          select: relationshipUserSelect,
        },
        userB: {
          select: relationshipUserSelect,
        },
      },
    }),

  listIncomingRequests: (userId: string) =>
    prisma.connectionRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: relationshipUserSelect,
        },
      },
    }),

  listOutgoingRequests: (userId: string) =>
    prisma.connectionRequest.findMany({
      where: {
        senderId: userId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        receiver: {
          select: relationshipUserSelect,
        },
      },
    }),

  findRequestById: (requestId: string) =>
    prisma.connectionRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: relationshipUserSelect,
        },
        receiver: {
          select: relationshipUserSelect,
        },
      },
    }),

  findRequestByUsers: (senderId: string, receiverId: string) =>
    prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId,
        },
      },
    }),

  upsertPendingRequest: (senderId: string, receiverId: string) =>
    prisma.connectionRequest.upsert({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId,
        },
      },
      create: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
      update: {
        status: 'PENDING',
      },
    }),

  updateRequestStatus: (requestId: string, status: 'ACCEPTED' | 'CANCELED' | 'AUTO_ACCEPTED') =>
    prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status },
    }),

  findConnectionByUsers: (userAId: string, userBId: string) =>
    prisma.connection.findUnique({
      where: {
        userAId_userBId: {
          userAId,
          userBId,
        },
      },
    }),

  createConnection: (data: {
    userAId: string;
    userBId: string;
    status: 'ACTIVE' | 'PENDING_MANAGER_APPROVAL';
    approvingManagerId?: string | null;
  }) =>
    prisma.connection.create({
      data: {
        userAId: data.userAId,
        userBId: data.userBId,
        status: data.status,
        approvingManagerId: data.approvingManagerId ?? null,
        approvedAt: data.status === 'ACTIVE' ? new Date() : null,
      },
    }),
};
