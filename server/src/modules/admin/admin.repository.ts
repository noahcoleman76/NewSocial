import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const adminUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  role: true,
  accountStatus: true,
  parentId: true,
  createdAt: true,
  children: {
    select: {
      id: true,
      username: true,
      displayName: true,
      accountStatus: true,
      role: true,
      parentId: true,
    },
  },
  parent: {
    select: {
      id: true,
      username: true,
      displayName: true,
      accountStatus: true,
      role: true,
      parentId: true,
    },
  },
} as const;

export const adminRepository = {
  countActiveAccounts: () =>
    prisma.user.count({
      where: {
        accountStatus: 'ACTIVE',
      },
    }),

  listUsers: () =>
    prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      select: adminUserSelect,
    }),

  findUserForModeration: (userId: string) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: adminUserSelect,
    }),

  setAccountStatus: (userIds: string[], accountStatus: 'ACTIVE' | 'DISABLED') =>
    prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        accountStatus,
      },
    }),

  promoteUserToAdmin: (userId: string) =>
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: 'ADMIN',
      },
      select: adminUserSelect,
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

  listAuditLogs: async () =>
    prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        adminUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    }),

  deletePost: (postId: string) =>
    prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        deletedAt: new Date(),
      },
    }),

  resolveOpenPostReports: (postId: string, adminUserId: string) =>
    prisma.report.updateMany({
      where: {
        targetType: 'POST',
        targetId: postId,
        status: 'OPEN',
      },
      data: {
        status: 'RESOLVED',
        reviewedByAdminId: adminUserId,
        reviewedAt: new Date(),
      },
    }),

  dismissReport: (reportId: string, adminUserId: string) =>
    prisma.report.updateMany({
      where: {
        id: reportId,
        status: 'OPEN',
      },
      data: {
        status: 'RESOLVED',
        reviewedByAdminId: adminUserId,
        reviewedAt: new Date(),
      },
    }),

  createAuditLog: (data: {
    adminUserId: string;
    actionType: string;
    targetType: string;
    targetId: string;
    metadata: Prisma.InputJsonValue;
  }) =>
    prisma.auditLog.create({
      data,
    }),
};







