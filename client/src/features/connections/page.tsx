import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assetUrl } from '@/lib/api';
import { PageCard } from '@/components/page-card';
import type { ConnectionListItem, ConnectionRequestListItem } from '@/types/app';

type ConnectionsResponse = {
  connections: ConnectionListItem[];
  pendingApprovals: ConnectionListItem[];
  incomingRequests: ConnectionRequestListItem[];
  outgoingRequests: ConnectionRequestListItem[];
};

const cardClass = 'rounded-[1.5rem] border border-white/10 p-4';

export const ConnectionsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [connectionSearch, setConnectionSearch] = useState('');

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
  const filteredConnections = useMemo(() => {
    const connections = connectionsQuery.data?.connections ?? [];
    const term = connectionSearch.trim().toLowerCase();

    if (!term) {
      return connections;
    }

    return connections.filter((connection) =>
      `${connection.user.displayName} ${connection.user.username}`.toLowerCase().includes(term),
    );
  }, [connectionSearch, connectionsQuery.data?.connections]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PageCard title="Connected">
        <input
          className="mb-4 w-full rounded-[1.5rem] border border-white/10 bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text)]/45 focus:border-[var(--accent)]"
          onChange={(event) => setConnectionSearch(event.target.value)}
          placeholder="Search connections"
          value={connectionSearch}
        />
        {connectionsQuery.isLoading ? <p className="text-sm text-[var(--text)]/60">Loading connections...</p> : null}
        {connectionsQuery.isError ? <p className="text-sm text-[var(--accent)]">Could not load connections.</p> : null}
        {connectionsQuery.data?.connections.length ? (
          <div className="space-y-3">
            {filteredConnections.map((connection) => (
              <div
                key={connection.id}
                className={`${cardClass} cursor-pointer transition hover:bg-white/12/5`}
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
                <div className="flex items-center gap-3">
                  {connection.user.profileImageUrl ? (
                    <img
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                      src={assetUrl(connection.user.profileImageUrl) ?? connection.user.profileImageUrl}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-[var(--text)]/65">
                      {connection.user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{connection.user.displayName}</p>
                    <p className="truncate text-sm text-[var(--text)]/60">@{connection.user.username}</p>
                  </div>
                </div>
                {connection.user.isFamilyConnection ? (
                  <p className="mt-4 text-sm font-medium text-[var(--accent)]">Family connection.</p>
                ) : (
                  <div className="mt-4">
                    <button
                      className="rounded-full border border-[var(--accent)]/35 px-4 py-2 text-sm font-medium text-[var(--accent)] disabled:opacity-60"
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Disconnect from ${connection.user.displayName}?`)) {
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
        {connectionsQuery.data && connectionsQuery.data.connections.length > 0 && filteredConnections.length === 0 ? (
          <p className="text-sm text-[var(--text)]/60">No matching connections.</p>
        ) : null}
        {connectionsQuery.data && connectionsQuery.data.connections.length === 0 ? (
          <p className="text-sm text-[var(--text)]/60">No connections yet.</p>
        ) : null}
      </PageCard>
      <PageCard title="Requests">
        {connectionsQuery.isLoading ? <p className="text-sm text-[var(--text)]/60">Loading requests...</p> : null}
        {connectionsQuery.data ? (
          <div className="space-y-5">
            <section className="space-y-3">
              {connectionsQuery.data.pendingApprovals.length ? (
                <>
                  <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--text)]/60">Waiting for family approval</h3>
                  {connectionsQuery.data.pendingApprovals.map((connection) => (
                    <div key={connection.id} className={cardClass}>
                      <p className="font-medium">{connection.user.displayName}</p>
                      <p className="text-sm text-[var(--text)]/60">@{connection.user.username}</p>
                      <p className="mt-2 text-sm text-[var(--text)]/60">
                        Waiting for family approval.
                      </p>
                    </div>
                  ))}
                </>
              ) : null}
            </section>
            <section className="space-y-3">
              {connectionsQuery.data.incomingRequests.length ? (
                <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--text)]/60">Incoming requests</h3>
              ) : null}
              {connectionsQuery.data.incomingRequests.length ? (
                connectionsQuery.data.incomingRequests.map((request) => (
                  <div key={request.id} className={cardClass}>
                    <p className="font-medium">{request.user.displayName}</p>
                    <p className="text-sm text-[var(--text)]/60">@{request.user.username}</p>
                    <div className="mt-4">
                      <button
                        className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[var(--text)]/85 disabled:opacity-60"
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
                <p className="text-sm text-[var(--text)]/60">No incoming requests.</p>
              )}
            </section>
          </div>
        ) : null}
      </PageCard>
    </div>
  );
};








