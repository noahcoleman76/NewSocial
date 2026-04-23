import { prisma } from '@/lib/prisma';

const authUserInclude = { parent: true, children: { select: { id: true } } };

const findUserByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: authUserInclude,
  });

const findUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    include: authUserInclude,
  });

export type AuthUserRecord = NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>;

export const authRepository = {
  findUserByEmail,

  findUserById,

  findUserByUsername: (username: string) =>
    prisma.user.findFirst({
      where: { username: username.toLowerCase() },
      include: authUserInclude,
    }),

  findLatestChildAccessCode: (childUserId: string) =>
    prisma.childAccessCode.findFirst({
      where: { childUserId },
      orderBy: { createdAt: 'desc' },
    }),

  findChildAccessCodeById: (id: string) =>
    prisma.childAccessCode.findUnique({
      where: { id },
    }),

  findUserByFamilyCode: (familyCode: string) =>
    prisma.user.findFirst({
      where: {
        familyCode,
        role: 'STANDARD',
      },
      include: authUserInclude,
    }),

  createUser: (data: {
    email: string;
    username: string;
    displayName: string;
    role: 'STANDARD' | 'CHILD' | 'ADMIN';
    passwordHash: string;
    parentId?: string | null;
    familyCode?: string | null;
  }) =>
    prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
      },
    }),

  createSession: (data: { id?: string; userId: string; refreshTokenHash: string; expiresAt: Date }) =>
    prisma.session.create({
      data,
    }),

  findSessionById: (id: string) =>
    prisma.session.findUnique({
      where: { id },
      include: {
        user: {
          include: authUserInclude,
        },
      },
    }),

  revokeSession: (id: string) =>
    prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    }),

  revokeUserSessions: (userId: string) =>
    prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),

  markChildAccessCodeUsed: (accessCodeId: string) =>
    prisma.childAccessCode.update({
      where: { id: accessCodeId },
      data: { usedAt: new Date() },
    }),

  setChildPassword: (childUserId: string, passwordHash: string) =>
    prisma.user.update({
      where: { id: childUserId },
      data: { passwordHash },
      include: authUserInclude,
    }),

  updatePassword: (userId: string, passwordHash: string) =>
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: authUserInclude,
    }),

  updateFamilyCode: (userId: string, familyCode: string) =>
    prisma.user.update({
      where: { id: userId },
      data: { familyCode },
      include: authUserInclude,
    }),
};
