import { prisma } from '@/lib/prisma';

export const reportsRepository = {
  create: (data: {
    reporterId: string;
    targetType: 'POST' | 'ACCOUNT';
    targetId: string;
    reason: string;
    message?: string;
  }) =>
    prisma.report.create({
      data,
    }),

  findAccountById: (userId: string) =>
    prisma.user.findFirst({
      where: {
        id: userId,
        accountStatus: 'ACTIVE',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImageUrl: true,
        role: true,
      },
    }),

  listOpenReports: () =>
    prisma.report.findMany({
      where: {
        status: 'OPEN',
        targetType: {
          in: ['POST', 'ACCOUNT'],
        },
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
