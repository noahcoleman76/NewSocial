import { connectionService } from '@/modules/connections/connection.service';

export const usersService = {
  searchUsers: (requesterId: string, query: string) => connectionService.searchUsers(requesterId, query),
};
