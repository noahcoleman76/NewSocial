import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/auth-store';
import { useAuthBootstrap } from '@/app/use-auth-bootstrap';
import type { CurrentUser } from '@/types/app';

export const ProtectedRoute = ({
  roles,
  condition,
  redirectTo = '/feed',
}: {
  roles?: string[];
  condition?: (user: CurrentUser) => boolean;
  redirectTo?: string;
}) => {
  const status = useAuthBootstrap();
  const user = useAuthStore((state) => state.currentUser);

  if (status === 'idle' || status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[#F5F5F5]/60">Checking session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (condition && !condition(user)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};



