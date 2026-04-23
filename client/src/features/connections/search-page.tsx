import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';
import type { SearchUser } from '@/types/app';

type SearchUsersResponse = {
  users: SearchUser[];
};

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400';

const relationshipLabel = (relationship: SearchUser['relationship']) => {
  switch (relationship) {
    case 'CONNECTED':
      return 'Connected';
    case 'OUTGOING_REQUEST':
      return 'Request sent';
    case 'INCOMING_REQUEST':
      return 'Accept request';
    case 'PENDING_MANAGER_APPROVAL':
      return 'Waiting for family approval';
    default:
      return 'Connect';
  }
};

export const SearchPage = () => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: async () => {
      const { data } = await api.get<SearchUsersResponse>('/users/search', {
        params: { q: debouncedQuery },
      });

      return data.users;
    },
    enabled: debouncedQuery.length > 0,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      await api.post('/connections/requests', { receiverId });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
      ]);
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/connections/requests/${requestId}/accept`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
      ]);
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/connections/requests/${requestId}/cancel`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
      ]);
    },
  });

  const busy =
    sendRequestMutation.isPending || acceptRequestMutation.isPending || cancelRequestMutation.isPending;

  return (
    <PageCard title="Search" subtitle="Basic profile discovery only. Posts stay hidden until an active mutual connection exists.">
      <input
        className={inputClass}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search username or display name"
        value={query}
      />
      <div className="mt-4 space-y-3">
        {!debouncedQuery ? (
          <p className="text-sm text-slate-500">Search by username or display name to find accounts.</p>
        ) : null}
        {searchQuery.isLoading ? <p className="text-sm text-slate-500">Searching...</p> : null}
        {searchQuery.isError ? <p className="text-sm text-rose-600">Could not search users right now.</p> : null}
        {searchQuery.data?.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            No matching accounts found.
          </div>
        ) : null}
        {searchQuery.data?.map((user) => (
          <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 p-4">
            <div>
              <p className="font-medium">{user.displayName}</p>
              <p className="text-sm text-slate-500">@{user.username}</p>
              {user.isFamilyLinked ? (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-700">
                  Family-linked account
                </p>
              ) : null}
              {user.relationship === 'PENDING_MANAGER_APPROVAL' ? (
                <p className="mt-2 text-sm text-slate-500">
                  This connection is waiting for family manager approval before posts and profile access unlock.
                </p>
              ) : null}
            </div>
            {user.relationship === 'INCOMING_REQUEST' && user.requestId ? (
              <button
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                disabled={busy}
                onClick={() => acceptRequestMutation.mutate(user.requestId!)}
                type="button"
              >
                {acceptRequestMutation.isPending ? 'Working...' : relationshipLabel(user.relationship)}
              </button>
            ) : null}
            {user.relationship === 'OUTGOING_REQUEST' && user.requestId ? (
              <button
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                disabled={busy}
                onClick={() => cancelRequestMutation.mutate(user.requestId!)}
                type="button"
              >
                {cancelRequestMutation.isPending ? 'Working...' : 'Cancel request'}
              </button>
            ) : null}
            {user.relationship === 'NONE' ? (
              <button
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                disabled={busy}
                onClick={() => sendRequestMutation.mutate(user.id)}
                type="button"
              >
                {sendRequestMutation.isPending ? 'Working...' : relationshipLabel(user.relationship)}
              </button>
            ) : null}
            {user.relationship === 'CONNECTED' ? (
              <span className="rounded-full bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white">
                {relationshipLabel(user.relationship)}
              </span>
            ) : null}
            {user.relationship === 'PENDING_MANAGER_APPROVAL' ? (
              <span className="rounded-full bg-amber-50 px-3 py-2 text-xs uppercase tracking-[0.16em] text-amber-700">
                {relationshipLabel(user.relationship)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </PageCard>
  );
};
