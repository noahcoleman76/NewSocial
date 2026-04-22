import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuthStore } from '@/app/auth-store';
import { AuthPage, ChildAccessPage, ChildSetPasswordPage } from '@/features/auth/pages';
import { FeedPage } from '@/features/feed/page';
import { SearchPage } from '@/features/connections/search-page';
import { MessagesPage, ConversationPage } from '@/features/messages/pages';
import { NotificationsPage } from '@/features/notifications/page';
import { ProfilePage } from '@/features/profile/page';
import { SettingsPage } from '@/features/profile/settings-page';
import { ConnectionsPage } from '@/features/connections/page';
import { PostPage } from '@/features/posts/post-page';
import { FamilyPage, FamilyChildPage, FamilyChildMessagesPage, FamilyChildConnectionsPage } from '@/features/family/pages';
import { AdminHomePage, AdminReportsPage, AdminUsersPage, AdminAuditPage } from '@/features/admin/pages';

const bootstrapAuth = () => {
  useAuthStore.getState().hydrate();
  return null;
};

export const router = createBrowserRouter([
  {
    path: '/',
    loader: bootstrapAuth,
    element: <Navigate to="/feed" replace />,
  },
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/register', element: <AuthPage mode="register" /> },
  { path: '/child-access', element: <ChildAccessPage /> },
  { path: '/child-set-password', element: <ChildSetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/feed', element: <FeedPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/messages', element: <MessagesPage /> },
          { path: '/messages/:conversationId', element: <ConversationPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/profile/:username', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/connections', element: <ConnectionsPage /> },
          { path: '/post/:postId', element: <PostPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['PARENT']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/family', element: <FamilyPage /> },
          { path: '/family/child/:childId', element: <FamilyChildPage /> },
          { path: '/family/child/:childId/messages', element: <FamilyChildMessagesPage /> },
          { path: '/family/child/:childId/connections', element: <FamilyChildConnectionsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['ADMIN']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/admin', element: <AdminHomePage /> },
          { path: '/admin/reports', element: <AdminReportsPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/audit-log', element: <AdminAuditPage /> },
        ],
      },
    ],
  },
]);
