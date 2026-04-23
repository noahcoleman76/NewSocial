import { useEffect } from 'react';
import { useAuthStore } from './auth-store';

export const useAuthBootstrap = () => {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    if (status === 'idle') {
      void initialize();
    }
  }, [initialize, status]);

  return status;
};
