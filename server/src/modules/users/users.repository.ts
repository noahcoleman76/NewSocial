import { demoConnections } from '@/lib/demo-data';

export const usersRepository = {
  search: async (query: string) =>
    demoConnections.filter((user) => {
      const q = query.toLowerCase();
      return user.displayName.toLowerCase().includes(q) || user.username.toLowerCase().includes(q);
    }),
};
