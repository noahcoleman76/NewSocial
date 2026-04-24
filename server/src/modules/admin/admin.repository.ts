import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const adminRepository = {
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
