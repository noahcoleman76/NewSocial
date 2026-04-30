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
  findDirectFamilyRelation: (userOneId: string, userTwoId: string) =>
    prisma.user.findFirst({
      where: {
        OR: [
          {
            id: userOneId,
            parentId: userTwoId,
            role: 'CHILD',
            accountStatus: 'ACTIVE',
            parent: {
              accountStatus: 'ACTIVE',
            },
          },
          {
            id: userTwoId,
            parentId: userOneId,
            role: 'CHILD',
            accountStatus: 'ACTIVE',
            parent: {
              accountStatus: 'ACTIVE',
            },
          },
        ],
      },
      select: {
        id: true,
      },
    }),

  searchUsers: (requesterId: string, query: string, includeDisabled = false) =>
    prisma.user.findMany({
      where: {
        id: {
          not: requesterId,
        },
        ...(includeDisabled ? {} : { accountStatus: 'ACTIVE' as const }),
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
        userA: { accountStatus: 'ACTIVE' },
        userB: { accountStatus: 'ACTIVE' },
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

  listActiveConnectionIds: async (userId: string) => {
    const connections = await prisma.connection.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ userAId: userId }, { userBId: userId }],
        userA: { accountStatus: 'ACTIVE' },
        userB: { accountStatus: 'ACTIVE' },
      },
      select: {
        userAId: true,
        userBId: true,
      },
    });

    return connections.map((connection) => (connection.userAId === userId ? connection.userBId : connection.userAId));
  },

  listFamilyConnectionIds: async (userId: string) => {
    const [parent, children] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          parentId: true,
          parent: {
            select: {
              id: true,
              accountStatus: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          parentId: userId,
          role: 'CHILD',
          accountStatus: 'ACTIVE',
        },
        select: {
          id: true,
        },
      }),
    ]);

    const familyIds = children.map((child) => child.id);

    if (parent?.parentId && parent.parent?.accountStatus === 'ACTIVE') {
      familyIds.push(parent.parentId);
    }

    return familyIds;
  },

  findChildConnectionForManager: (managerUserId: string, targetUserId: string) =>
    prisma.connection.findFirst({
      where: {
        status: {
          in: ['ACTIVE', 'PENDING_MANAGER_APPROVAL'],
        },
        AND: [
          {
            OR: [{ approvingManagerId: managerUserId }, { approvingManagerId: null }],
          },
          {
            OR: [
              {
                userAId: targetUserId,
                userB: {
                  parentId: managerUserId,
                  role: 'CHILD',
                  accountStatus: 'ACTIVE',
                },
              },
              {
                userBId: targetUserId,
                userA: {
                  parentId: managerUserId,
                  role: 'CHILD',
                  accountStatus: 'ACTIVE',
                },
              },
            ],
          },
        ],
        userA: { accountStatus: 'ACTIVE' },
        userB: { accountStatus: 'ACTIVE' },
      },
      select: {
        id: true,
      },
    }),

  listPendingApprovalConnections: (userId: string) =>
    prisma.connection.findMany({
      where: {
        status: 'PENDING_MANAGER_APPROVAL',
        OR: [{ userAId: userId }, { userBId: userId }],
        userA: { accountStatus: 'ACTIVE' },
        userB: { accountStatus: 'ACTIVE' },
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
        sender: { accountStatus: 'ACTIVE' },
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
        receiver: { accountStatus: 'ACTIVE' },
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

  removeActiveConnection: (userAId: string, userBId: string) =>
    prisma.connection.deleteMany({
      where: {
        userAId,
        userBId,
        status: 'ACTIVE',
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


