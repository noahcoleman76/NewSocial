import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/auth-store';

export const ProtectedRoute = ({ roles }: { roles?: string[] }) => {
  const user = useAuthStore((state) => state.currentUser);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
};
