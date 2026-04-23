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
