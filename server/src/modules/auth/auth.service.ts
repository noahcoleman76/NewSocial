import { authRepository } from './auth.repository';

export const authService = {
  getCurrentUser: () => authRepository.getCurrentUser(),
};
