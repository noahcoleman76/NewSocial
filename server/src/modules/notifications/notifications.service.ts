import { notificationsRepository } from './notifications.repository';

export const notificationsService = {
  listNotifications: () => notificationsRepository.list(),
};
