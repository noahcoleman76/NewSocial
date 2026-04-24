import { prisma } from '@/lib/prisma';

export const reportsRepository = {
  create: (data: {
    reporterId: string;
    targetType: 'POST' | 'ACCOUNT' | 'MESSAGE';
    targetId: string;
    reason: string;
    message?: string;
  }) =>
    prisma.report.create({
      data,
    }),

  listOpenReports: () =>
    prisma.report.findMany({
      where: {
        status: 'OPEN',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    }),
};
