export const userRoles = ['STANDARD', 'PARENT', 'CHILD', 'ADMIN'] as const;
export const accountStatuses = ['ACTIVE', 'DISABLED', 'DELETED'] as const;
export const connectionRequestStatuses = ['PENDING', 'ACCEPTED', 'CANCELED', 'AUTO_ACCEPTED'] as const;
export const notificationTypes = ['CONNECTION_ACCEPTED', 'POST_COMMENT'] as const;
export const reportTargetTypes = ['POST', 'ACCOUNT', 'MESSAGE'] as const;
export const reportStatuses = ['OPEN', 'REVIEWED', 'RESOLVED'] as const;
export const parentDeleteOutcomes = ['DELETE_CHILDREN', 'RELEASE_CHILDREN'] as const;
export const feedItemTypes = ['post', 'ad'] as const;

export type UserRole = (typeof userRoles)[number];
export type AccountStatus = (typeof accountStatuses)[number];
export type ConnectionRequestStatus = (typeof connectionRequestStatuses)[number];
export type NotificationType = (typeof notificationTypes)[number];
export type ReportTargetType = (typeof reportTargetTypes)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type ParentDeleteOutcome = (typeof parentDeleteOutcomes)[number];

export type FeedPostItem = {
  type: 'post';
  postId: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
    role: UserRole;
  };
  caption: string | null;
  images: string[];
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
};

export type FeedAdItem = {
  type: 'ad';
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export type FeedItem = FeedPostItem | FeedAdItem;
