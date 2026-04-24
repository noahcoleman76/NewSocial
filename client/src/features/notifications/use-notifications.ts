import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type NotificationItem = {
  id: string;
  type: 'CONNECTION_ACCEPTED' | 'POST_COMMENT';
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
};

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>('/notifications');
      return data.notifications;
    },
  });
