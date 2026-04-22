import { usersRepository } from './users.repository';

export const usersService = {
  searchUsers: (query: string) => usersRepository.search(query),
};
