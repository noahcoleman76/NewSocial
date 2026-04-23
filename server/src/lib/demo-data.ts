export const demoCurrentUser = {
  id: 'parent-1',
  username: 'family.parent',
  displayName: 'Morgan Parent',
  email: 'parent@newsocial.local',
  bio: 'Managing a calmer family space online.',
  role: 'STANDARD',
  familyCode: 'FAMILY123',
  accountStatus: 'ACTIVE',
  profileImageUrl: null,
  hasChildren: true,
} as const;

export const demoFeed = [
  {
    type: 'post',
    postId: 'post-1',
    createdAt: '2026-04-21T13:00:00.000Z',
    author: {
      id: 'user-1',
      username: 'jamie',
      displayName: 'Jamie Brooks',
      profileImageUrl: null,
      role: 'STANDARD',
    },
    caption: 'A quiet dinner with cousins and no phones on the table.',
    images: [],
    commentCount: 2,
    likeCount: 4,
    likedByMe: true,
  },
  {
    type: 'ad',
    id: 'ad-1',
    title: 'Community Garden Signup',
    body: 'Reserve a family volunteer slot for Saturday morning.',
    imageUrl: null,
    ctaLabel: 'Open details',
    ctaUrl: '#',
  },
  {
    type: 'post',
    postId: 'post-2',
    createdAt: '2026-04-20T09:00:00.000Z',
    author: {
      id: 'user-2',
      username: 'riley',
      displayName: 'Riley Chen',
      profileImageUrl: null,
      role: 'STANDARD',
    },
    caption: 'Weekend hike photos from a family trail.',
    images: [],
    commentCount: 1,
    likeCount: 3,
    likedByMe: false,
  },
] as const;

export const demoConnections = [
  { id: 'user-1', username: 'jamie', displayName: 'Jamie Brooks', profileImageUrl: null },
  { id: 'user-2', username: 'riley', displayName: 'Riley Chen', profileImageUrl: null },
  {
    id: 'child-1',
    username: 'child.one',
    displayName: 'Avery Parent-Linked',
    profileImageUrl: null,
    isChildAccount: true,
  },
] as const;

export const demoConversations = [
  {
    id: 'conversation-1',
    title: 'Jamie Brooks',
    unread: true,
    preview: 'Checking in before dinner.',
    updatedAt: '2026-04-21T19:30:00.000Z',
  },
  {
    id: 'conversation-2',
    title: 'Deleted User',
    unread: false,
    preview: 'This message remains after deletion.',
    updatedAt: '2026-04-20T10:30:00.000Z',
  },
] as const;

export const demoNotifications = [
  {
    id: 'notification-1',
    type: 'POST_COMMENT',
    title: 'New comment on your post',
    body: 'Jamie left a comment.',
    createdAt: '2026-04-21T13:30:00.000Z',
    href: '/post/post-1',
    read: false,
  },
  {
    id: 'notification-2',
    type: 'CONNECTION_ACCEPTED',
    title: 'Connection accepted',
    body: 'Riley is now connected with you.',
    createdAt: '2026-04-20T09:15:00.000Z',
    href: '/profile/riley',
    read: true,
  },
] as const;

export const demoChildren = demoConnections.filter((connection) => 'isChildAccount' in connection);
export const demoAuditLog = [
  {
    id: 'audit-1',
    adminUserId: 'admin-1',
    actionType: 'DISABLE_ACCOUNT',
    targetType: 'USER',
    targetId: 'disabled-user-1',
    metadata: { reason: 'Seed moderation example' },
    createdAt: '2026-04-22T12:00:00.000Z',
  },
];
