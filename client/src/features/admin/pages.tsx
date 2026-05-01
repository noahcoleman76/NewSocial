import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';

type AdminSummaryResponse = {
  activeAccountCount: number;
};

type AdminReport = {
  id: string;
  targetType: 'POST' | 'ACCOUNT';
  targetId: string;
  reason: string;
  message?: string | null;
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    displayName: string;
  };
  targetAccount: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
    role: 'STANDARD' | 'CHILD' | 'ADMIN';
  } | null;
  targetPost: {
    id: string;
    caption: string | null;
    author: {
      id: string;
      username: string;
      displayName: string;
    };
  } | null;
};

type AdminReportsResponse = {
  reports: AdminReport[];
};

export const AdminHomePage = () => {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['admin-summary'],
    queryFn: async () => {
      const { data } = await api.get<AdminSummaryResponse>('/admin/summary');
      return data;
    },
  });

  const reportsQuery = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await api.get<AdminReportsResponse>('/admin/reports');
      return data.reports;
    },
  });

  const dismissReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.post(`/admin/reports/${reportId}/dismiss`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
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
    <div className="space-y-6">
      <PageCard title="Admin">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text)]/45">Active accounts</p>
          <p className="mt-2 text-4xl font-semibold text-[var(--text)]">
            {summaryQuery.isLoading ? '...' : summaryQuery.data?.activeAccountCount ?? 0}
          </p>
          {summaryQuery.isError ? <p className="mt-2 text-sm text-[var(--accent)]">Could not load count.</p> : null}
        </div>
      </PageCard>

      <PageCard title="Reports">
        {reportsQuery.isLoading ? <p className="text-sm text-[var(--text)]/60">Loading reports...</p> : null}
        {reportsQuery.isError ? <p className="text-sm text-[var(--accent)]">Could not load reports.</p> : null}
        {reportsQuery.data && reportsQuery.data.length === 0 ? <p className="text-sm text-[var(--text)]/60">No reports.</p> : null}
        <div className="space-y-3">
          {reportsQuery.data?.map((report) => (
            <div key={report.id} className="rounded-[1.5rem] border border-white/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[var(--text)]">{report.targetType} report</p>
                  <p className="mt-1 text-sm text-[var(--text)]/60">Reason: {report.reason}</p>
                  {report.message ? <p className="mt-2 text-sm text-[var(--text)]/75">{report.message}</p> : null}
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text)]/45">
                    Reported by{' '}
                    <Link className="text-[var(--text)]/85 underline" to={`/profile/${report.reporter.username}`}>
                      {report.reporter.displayName}
                    </Link>{' '}
                    on {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text)]/85 disabled:opacity-60"
                  disabled={dismissReportMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Dismiss this report?')) {
                      dismissReportMutation.mutate(report.id);
                    }
                  }}
                  type="button"
                >
                  {dismissReportMutation.isPending ? 'Dismissing...' : 'Dismiss report'}
                </button>
              </div>

              {report.targetType === 'ACCOUNT' && report.targetAccount ? (
                <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/7 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text)]/45">Reported account</p>
                  <Link className="mt-2 inline-block font-medium text-[var(--text)] underline" to={`/profile/${report.targetAccount.username}`}>
                    {report.targetAccount.displayName}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--text)]/60">@{report.targetAccount.username}</p>
                </div>
              ) : null}

              {report.targetType === 'POST' && report.targetPost ? (
                <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/7 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text)]/45">Reported post</p>
                  <p className="mt-2 text-sm text-[var(--text)]/75">{report.targetPost.caption ?? 'Image-only post'}</p>
                  <p className="mt-2 text-sm text-[var(--text)]/60">
                    By{' '}
                    <Link className="text-[var(--text)]/85 underline" to={`/profile/${report.targetPost.author.username}`}>
                      {report.targetPost.author.displayName}
                    </Link>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text)]/85" to={`/post/${report.targetPost.id}`}>
                      Open post
                    </Link>
                    <button
                      className="rounded-full border border-[var(--accent)]/35 px-4 py-2 text-sm text-[var(--accent)] disabled:opacity-60"
                      disabled={deletePostMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Delete this reported post?')) {
                          deletePostMutation.mutate(report.targetPost!.id);
                        }
                      }}
                      type="button"
                    >
                      {deletePostMutation.isPending ? 'Deleting...' : 'Delete post'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  );
};

export const AdminReportsPage = AdminHomePage;
export const AdminUsersPage = AdminHomePage;
export const AdminAuditPage = AdminHomePage;









