import { notificationsRepository } from './notifications.repository';

export const notificationsService = {
  listNotifications: async (userId: string) => {
    const items = await notificationsRepository.list(userId);

    return items.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title:
        notification.type === 'POST_COMMENT'
          ? 'Comment on your post'
          : 'Connection accepted',
      body:
        notification.type === 'POST_COMMENT'
          ? 'Someone commented on your post.'
          : 'A connection request was accepted.',
      href:
        notification.type === 'POST_COMMENT'
          ? `/post/${notification.entityId}`
          : `/profile/${notification.entityId}`,
      read: Boolean(notification.readAt),
      createdAt: notification.createdAt,
    }));
  },
  createNotification: notificationsRepository.create,
  markRead: async (userId: string, notificationId: string) => {
    const result = await notificationsRepository.markRead(userId, notificationId);
    return result.count > 0;
  },
  markAllRead: async (userId: string) => {
    await notificationsRepository.markAllRead(userId);
  },
  clearAll: async (userId: string) => {
    await notificationsRepository.clearAll(userId);
  },
};


