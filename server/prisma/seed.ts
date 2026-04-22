import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.messageImage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.connectionRequest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.childAccessCode.deleteMany();
  await prisma.seedAdContent.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@newsocial.local',
      username: 'admin',
      displayName: 'Admin User',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const parent = await prisma.user.create({
    data: {
      email: 'parent@newsocial.local',
      username: 'family.parent',
      displayName: 'Morgan Parent',
      passwordHash,
      role: 'PARENT',
    },
  });

  const [childOne, childTwo, userA, userB, userC, disabledUser, disabledParent, disabledChild, deletedGhost] =
    await Promise.all([
      prisma.user.create({
        data: {
          email: 'child1@newsocial.local',
          username: 'child.one',
          displayName: 'Avery Parent-Linked',
          role: 'CHILD',
          parentId: parent.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'child2@newsocial.local',
          username: 'child.two',
          displayName: 'Rowan Parent-Linked',
          role: 'CHILD',
          parentId: parent.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'jamie@newsocial.local',
          username: 'jamie',
          displayName: 'Jamie Brooks',
          passwordHash,
          role: 'STANDARD',
        },
      }),
      prisma.user.create({
        data: {
          email: 'riley@newsocial.local',
          username: 'riley',
          displayName: 'Riley Chen',
          passwordHash,
          role: 'STANDARD',
        },
      }),
      prisma.user.create({
        data: {
          email: 'alex@newsocial.local',
          username: 'alex',
          displayName: 'Alex Rivera',
          passwordHash,
          role: 'STANDARD',
        },
      }),
      prisma.user.create({
        data: {
          email: 'disabled@newsocial.local',
          username: 'disabled.user',
          displayName: 'Disabled Standard',
          passwordHash,
          role: 'STANDARD',
          accountStatus: 'DISABLED',
        },
      }),
      prisma.user.create({
        data: {
          email: 'disabled-parent@newsocial.local',
          username: 'disabled.parent',
          displayName: 'Disabled Parent',
          passwordHash,
          role: 'PARENT',
          accountStatus: 'DISABLED',
        },
      }),
      prisma.user.create({
        data: {
          email: 'disabled-child@newsocial.local',
          username: 'disabled.child',
          displayName: 'Disabled Child',
          role: 'CHILD',
          parentId: undefined,
          accountStatus: 'DISABLED',
        },
      }),
      prisma.user.create({
        data: {
          email: 'deleted@newsocial.local',
          username: 'deleted.user',
          displayName: 'Deleted Sender',
          role: 'STANDARD',
          accountStatus: 'DELETED',
          deletedAt: new Date(),
          usernameReusableAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

  await prisma.user.update({
    where: { id: disabledChild.id },
    data: { parentId: disabledParent.id },
  });

  await prisma.childAccessCode.createMany({
    data: [
      {
        childUserId: childOne.id,
        codeHash: await bcrypt.hash('ABC12345', 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        childUserId: childTwo.id,
        codeHash: await bcrypt.hash('XYZ67890', 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.connection.createMany({
    data: [
      { userAId: [parent.id, userA.id].sort()[0], userBId: [parent.id, userA.id].sort()[1] },
      { userAId: [userA.id, userB.id].sort()[0], userBId: [userA.id, userB.id].sort()[1] },
      { userAId: [childOne.id, userA.id].sort()[0], userBId: [childOne.id, userA.id].sort()[1] },
      { userAId: [childTwo.id, userB.id].sort()[0], userBId: [childTwo.id, userB.id].sort()[1] },
    ],
  });

  await prisma.connectionRequest.createMany({
    data: [
      { senderId: userC.id, receiverId: parent.id, status: 'PENDING' },
      { senderId: userA.id, receiverId: childTwo.id, status: 'PENDING' },
    ],
  });

  const recentPost = await prisma.post.create({
    data: {
      authorId: userA.id,
      caption: 'A quiet afternoon with family.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      images: {
        create: [{ imageUrl: '/uploads/seed/recent-post.jpg', sortOrder: 0 }],
      },
    },
  });

  const oldPost = await prisma.post.create({
    data: {
      authorId: userA.id,
      caption: 'Older memory that should stay on profile only.',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      postId: recentPost.id,
      authorId: parent.id,
      body: 'Looks like a good day.',
    },
  });

  await prisma.postLike.createMany({
    data: [
      { postId: recentPost.id, userId: parent.id },
      { postId: recentPost.id, userId: childOne.id },
    ],
  });

  const conversation = await prisma.conversation.create({
    data: {
      directKey: [userA.id, parent.id].sort().join(':'),
      participants: {
        create: [{ userId: userA.id }, { userId: parent.id }],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: userA.id,
        senderSnapshotName: userA.displayName,
        body: 'Checking in before dinner.',
      },
      {
        conversationId: conversation.id,
        senderId: null,
        senderSnapshotName: 'Deleted User',
        body: 'This message remains after deletion.',
        deletedSenderLabel: true,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: parent.id,
        type: 'POST_COMMENT',
        entityType: 'POST',
        entityId: recentPost.id,
      },
      {
        userId: userA.id,
        type: 'CONNECTION_ACCEPTED',
        entityType: 'USER',
        entityId: parent.id,
      },
    ],
  });

  await prisma.report.create({
    data: {
      reporterId: userB.id,
      targetType: 'POST',
      targetId: oldPost.id,
      reason: 'Possible privacy concern',
      message: 'This older post includes location details.',
      status: 'OPEN',
    },
  });

  await prisma.seedAdContent.createMany({
    data: [
      {
        title: 'Community Garden Signup',
        body: 'Reserve a family volunteer slot for Saturday morning.',
        ctaLabel: 'View details',
        ctaUrl: '/community/garden',
      },
      {
        title: 'School Event Reminder',
        body: 'Spring showcase tickets are available this week.',
        ctaLabel: 'Open event',
        ctaUrl: '/events/showcase',
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      adminUserId: admin.id,
      actionType: 'DISABLE_ACCOUNT',
      targetType: 'USER',
      targetId: disabledUser.id,
      metadata: { reason: 'Seed moderation example' },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
