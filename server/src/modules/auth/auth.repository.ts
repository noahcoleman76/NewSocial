import { demoCurrentUser } from '@/lib/demo-data';

export const authRepository = {
  getCurrentUser: async () => demoCurrentUser,
};
