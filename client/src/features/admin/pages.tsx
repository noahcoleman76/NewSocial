import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';

export const AdminHomePage = () => (
  <PageCard title="Admin" subtitle="Moderation tools for reports, users, posts, and audit history.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Open reports</div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Account moderation</div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Audit log</div>
    </div>
  </PageCard>
);

type AdminReport = {
  id: string;
  targetType: 'POST' | 'ACCOUNT' | 'MESSAGE';
  targetId: string;
  reason: string;
  message?: string | null;
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    displayName: string;
  };
};

type AdminReportsResponse = {
  reports: AdminReport[];
};

export const AdminReportsPage = () => {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await api.get<AdminReportsResponse>('/admin/reports');
      return data.reports;
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/admin/posts/${postId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });

  return (
    <PageCard title="Reports" subtitle="Open moderation reports for posts, accounts, and messages.">
      {reportsQuery.isLoading ? <p className="text-sm text-slate-500">Loading reports...</p> : null}
      {reportsQuery.isError ? <p className="text-sm text-rose-600">Could not load reports right now.</p> : null}
      <div className="space-y-3">
        {reportsQuery.data?.map((report) => (
          <div key={report.id} className="rounded-[1.5rem] border border-slate-200 p-4">
            <p className="font-medium">
              {report.targetType} report
            </p>
            <p className="mt-1 text-sm text-slate-500">Reason: {report.reason}</p>
            {report.message ? <p className="mt-2 text-sm text-slate-600">{report.message}</p> : null}
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              Reported by {report.reporter.displayName} on {new Date(report.createdAt).toLocaleString()}
            </p>
            {report.targetType === 'POST' ? (
              <div className="mt-4">
                <button
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700 disabled:opacity-60"
                  disabled={deletePostMutation.isPending}
                  onClick={() => deletePostMutation.mutate(report.targetId)}
                  type="button"
                >
                  {deletePostMutation.isPending ? 'Deleting...' : 'Delete reported post'}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </PageCard>
  );
};

export const AdminUsersPage = () => (
  <PageCard title="Users" subtitle="Admins can disable, enable, or delete accounts. Child enablement still requires an active parent.">
    <div className="space-y-3">
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Morgan Parent</div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Disabled Standard</div>
    </div>
  </PageCard>
);

export const AdminAuditPage = () => (
  <PageCard title="Audit log" subtitle="Administrative account actions are recorded with actor and timestamp metadata.">
    <div className="rounded-[1.5rem] border border-slate-200 p-4">
      <p className="font-medium">DISABLE_ACCOUNT</p>
      <p className="mt-1 text-sm text-slate-500">Admin User disabled Disabled Standard on 2026-04-22.</p>
    </div>
  </PageCard>
);
