import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';
import { useNotifications } from './use-notifications';

export const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const notificationsQuery = useNotifications();

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/notifications/${notificationId}/read`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/notifications');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <PageCard title="Notifications" subtitle="Only connection accepted and comment notifications appear here.">
      <div className="mb-4">
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
            disabled={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
            type="button"
          >
            {markAllReadMutation.isPending ? 'Updating...' : 'Mark all read'}
          </button>
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
            disabled={!notificationsQuery.data?.length || clearAllMutation.isPending}
            onClick={() => clearAllMutation.mutate()}
            type="button"
          >
            {clearAllMutation.isPending ? 'Clearing...' : 'Clear all'}
          </button>
        </div>
      </div>
      {notificationsQuery.isLoading ? <p className="text-sm text-slate-500">Loading notifications...</p> : null}
      {notificationsQuery.isError ? <p className="text-sm text-rose-600">Could not load notifications right now.</p> : null}
      {notificationsQuery.data?.length === 0 ? (
        <p className="text-sm text-slate-500">No notifications right now.</p>
      ) : null}
      <div className="space-y-3">
        {notificationsQuery.data?.map((notification) => (
          <Link
            key={notification.id}
            className="block rounded-[1.5rem] border border-slate-200 p-4 transition hover:bg-slate-50"
            onClick={() => {
              if (!notification.read) {
                markReadMutation.mutate(notification.id);
              }
            }}
            to={notification.href}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-500">{notification.body}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read ? <span className="h-3 w-3 rounded-full bg-slate-900" /> : null}
            </div>
          </Link>
        ))}
      </div>
    </PageCard>
  );
};

