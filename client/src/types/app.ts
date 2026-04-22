import type { FeedItem, NotificationType, UserRole } from '@shared/types/domain';

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string | null;
  role: UserRole;
  accountStatus: 'ACTIVE' | 'DISABLED' | 'DELETED';
  profileImageUrl: string | null;
};

export type ConnectionCard = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  isChildAccount?: boolean;
};

export type ConversationSummary = {
  id: string;
  title: string;
  unread: boolean;
  preview: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  href: string;
  read: boolean;
};

export type DashboardSnapshot = {
  currentUser: CurrentUser;
  feed: FeedItem[];
  connections: ConnectionCard[];
  conversations: ConversationSummary[];
  notifications: NotificationItem[];
};
