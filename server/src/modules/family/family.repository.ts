import { prisma } from '@/lib/prisma';

export const familyRepository = {
  listChildren: (managerUserId: string) =>
    prisma.user.findMany({
      where: {
        parentId: managerUserId,
        role: 'CHILD',
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        createdAt: true,
      },
    }),

  countPendingApprovalsForChild: (managerUserId: string, childId: string) =>
    prisma.connection.count({
      where: {
        approvingManagerId: managerUserId,
        status: 'PENDING_MANAGER_APPROVAL',
        OR: [{ userAId: childId }, { userBId: childId }],
      },
    }),

  getFamilyCode: async (managerUserId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: managerUserId },
      select: { familyCode: true },
    });

    return user?.familyCode ?? null;
  },

  findChildById: (managerUserId: string, childId: string) =>
    prisma.user.findFirst({
      where: {
        id: childId,
        parentId: managerUserId,
        role: 'CHILD',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        createdAt: true,
        bio: true,
        profileImageUrl: true,
      },
    }),

  listChildConversations: (managerUserId: string, childId: string) =>
    prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: childId,
            user: {
              parentId: managerUserId,
              role: 'CHILD',
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImageUrl: true,
                role: true,
                accountStatus: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
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
          },
        },
      },
    }),

  listChildConnections: async (managerUserId: string, childId: string) => {
    const [connections, pendingApprovals, incomingRequests, outgoingRequests] = await Promise.all([
      prisma.connection.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ userAId: childId }, { userBId: childId }],
          AND: [
            {
              OR: [
                {
                  userAId: childId,
                  userB: {
                    accountStatus: 'ACTIVE',
                  },
                },
                {
                  userBId: childId,
                  userA: {
                    accountStatus: 'ACTIVE',
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          userA: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
              role: true,
              accountStatus: true,
              parentId: true,
            },
          },
          userB: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
              role: true,
              accountStatus: true,
              parentId: true,
            },
          },
        },
      }),
      prisma.connection.findMany({
        where: {
          status: 'PENDING_MANAGER_APPROVAL',
          approvingManagerId: managerUserId,
          OR: [{ userAId: childId }, { userBId: childId }],
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          userA: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
              role: true,
              accountStatus: true,
              parentId: true,
            },
          },
          userB: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
              role: true,
              accountStatus: true,
              parentId: true,
            },
          },
        },
      }),
      prisma.connectionRequest.findMany({
        where: {
          receiverId: childId,
          status: 'PENDING',
          receiver: {
            parentId: managerUserId,
            role: 'CHILD',
          },
          sender: {
            accountStatus: 'ACTIVE',
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
              role: true,
              parentId: true,
            },
          },
        },
      }),
      prisma.connectionRequest.findMany({
        where: {
          senderId: childId,
          status: 'PENDING',
          sender: {
            parentId: managerUserId,
            role: 'CHILD',
          },
          receiver: {
            accountStatus: 'ACTIVE',
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
              role: true,
              parentId: true,
            },
          },
        },
      }),
    ]);

    return { connections, pendingApprovals, incomingRequests, outgoingRequests };
  },

  approvePendingConnection: (managerUserId: string, childId: string, connectionId: string) =>
    prisma.connection.updateMany({
      where: {
        id: connectionId,
        status: 'PENDING_MANAGER_APPROVAL',
        approvingManagerId: managerUserId,
        rejectedAt: null,
        OR: [{ userAId: childId }, { userBId: childId }],
      },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        rejectedAt: null,
      },
    }),

  rejectPendingConnection: (managerUserId: string, childId: string, connectionId: string) =>
    prisma.connection.updateMany({
      where: {
        id: connectionId,
        status: 'PENDING_MANAGER_APPROVAL',
        approvingManagerId: managerUserId,
        OR: [{ userAId: childId }, { userBId: childId }],
      },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    }),

  releaseChild: (managerUserId: string, childId: string) =>
    prisma.user.updateMany({
      where: {
        id: childId,
        parentId: managerUserId,
        role: 'CHILD',
      },
      data: {
        role: 'STANDARD',
        parentId: null,
      },
    }),

  deleteChild: (managerUserId: string, childId: string) =>
    prisma.user.deleteMany({
      where: {
        id: childId,
        parentId: managerUserId,
        role: 'CHILD',
      },
    }),
};
