import { prisma } from '@/lib/prisma';

export const notificationsRepository = {
  list: (userId: string) =>
    prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

  create: (data: {
    userId: string;
    type: 'CONNECTION_ACCEPTED' | 'POST_COMMENT';
    entityType: string;
    entityId: string;
  }) =>
    prisma.notification.create({
      data,
    }),

  markRead: (userId: string, notificationId: string) =>
    prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        readAt: new Date(),
      },
    }),

  markAllRead: (userId: string) =>
    prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    }),

  clearAll: (userId: string) =>
    prisma.notification.deleteMany({
      where: {
        userId,
      },
    }),
};


