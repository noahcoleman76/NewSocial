import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';
import type { ConnectionListItem, ConnectionRequestListItem } from '@/types/app';

type ConnectionsResponse = {
  connections: ConnectionListItem[];
  pendingApprovals: ConnectionListItem[];
  incomingRequests: ConnectionRequestListItem[];
  outgoingRequests: ConnectionRequestListItem[];
};

const cardClass = 'rounded-[1.5rem] border border-slate-200 p-4';

export const ConnectionsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data } = await api.get<ConnectionsResponse>('/connections');
      return data;
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/connections/requests/${requestId}/accept`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
      ]);
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/connections/requests/${requestId}/cancel`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
      ]);
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/connections/${userId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
      ]);
    },
  });

  const busy = acceptRequestMutation.isPending || cancelRequestMutation.isPending || removeConnectionMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PageCard title="Connected" subtitle="Active mutual connections with profile and messaging access.">
        {connectionsQuery.isLoading ? <p className="text-sm text-slate-500">Loading connections...</p> : null}
        {connectionsQuery.isError ? <p className="text-sm text-rose-600">Could not load connections right now.</p> : null}
        {connectionsQuery.data?.connections.length ? (
          <div className="space-y-3">
            {connectionsQuery.data.connections.map((connection) => (
              <div
                key={connection.id}
                className={`${cardClass} cursor-pointer transition hover:bg-slate-50`}
                onClick={() => navigate(`/profile/${connection.user.username}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/profile/${connection.user.username}`);
                  }
                }}
              >
                <p className="font-medium">{connection.user.displayName}</p>
                <p className="text-sm text-slate-500">@{connection.user.username}</p>
                {connection.user.isFamilyLinked ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-700">Family-linked account</p>
                ) : null}
                {connection.user.isFamilyConnection ? (
                  <p className="mt-4 text-sm text-slate-500">Family-linked accounts stay connected automatically.</p>
                ) : (
                  <div className="mt-4">
                    <button
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Are you sure you want to disconnect from ${connection.user.displayName}?`)) {
                          removeConnectionMutation.mutate(connection.user.id);
                        }
                      }}
                      type="button"
                    >
                      {removeConnectionMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
        {connectionsQuery.data && connectionsQuery.data.connections.length === 0 ? (
          <p className="text-sm text-slate-500">No active connections yet.</p>
        ) : null}
      </PageCard>
      <PageCard title="Requests" subtitle="Pending requests stay open until canceled, accepted, or moved to family approval.">
        {connectionsQuery.isLoading ? <p className="text-sm text-slate-500">Loading requests...</p> : null}
        {connectionsQuery.data ? (
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Waiting for family approval</h3>
              {connectionsQuery.data.pendingApprovals.length ? (
                connectionsQuery.data.pendingApprovals.map((connection) => (
                  <div key={connection.id} className={cardClass}>
                    <p className="font-medium">{connection.user.displayName}</p>
                    <p className="text-sm text-slate-500">@{connection.user.username}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      This connection is waiting for a family manager to approve it before it becomes active.
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No connections are waiting on family approval.</p>
              )}
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Incoming requests</h3>
              {connectionsQuery.data.incomingRequests.length ? (
                connectionsQuery.data.incomingRequests.map((request) => (
                  <div key={request.id} className={cardClass}>
                    <p className="font-medium">{request.user.displayName}</p>
                    <p className="text-sm text-slate-500">@{request.user.username}</p>
                    {request.user.isFamilyLinked ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-700">
                        Family-linked account
                      </p>
                    ) : null}
                    <div className="mt-4">
                      <button
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                        disabled={busy}
                        onClick={() => acceptRequestMutation.mutate(request.id)}
                        type="button"
                      >
                        {acceptRequestMutation.isPending ? 'Working...' : 'Accept request'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No incoming requests right now.</p>
              )}
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Outgoing requests</h3>
              {connectionsQuery.data.outgoingRequests.length ? (
                connectionsQuery.data.outgoingRequests.map((request) => (
                  <div key={request.id} className={cardClass}>
                    <p className="font-medium">{request.user.displayName}</p>
                    <p className="text-sm text-slate-500">@{request.user.username}</p>
                    <div className="mt-4">
                      <button
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                        disabled={busy}
                        onClick={() => cancelRequestMutation.mutate(request.id)}
                        type="button"
                      >
                        {cancelRequestMutation.isPending ? 'Working...' : 'Cancel request'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No outgoing requests right now.</p>
              )}
            </section>
          </div>
        ) : null}
      </PageCard>
    </div>
  );
};
