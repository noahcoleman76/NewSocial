import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';
import type { SearchUser } from '@/types/app';

type SearchUsersResponse = {
  users: SearchUser[];
};

const inputClass =
  'w-full rounded-2xl border border-white/10 px-4 py-3 outline-none transition focus:border-[#FF5A2F]';

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
    <PageCard title="Search">
      <input
        className={inputClass}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search people"
        value={query}
      />
      <div className="mt-4 space-y-3">
        {!debouncedQuery ? (
          <p className="text-sm text-[#F5F5F5]/60">Search by name or username.</p>
        ) : null}
        {searchQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Searching...</p> : null}
        {searchQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not search.</p> : null}
        {searchQuery.data?.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm text-[#F5F5F5]/75">
            No matches.
          </div>
        ) : null}
        {searchQuery.data?.map((user) => (
          <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 p-4">
            <div>
              <Link className="font-medium text-[#F5F5F5] hover:underline" to={`/profile/${user.username}`}>
                {user.displayName}
              </Link>
              <p className="text-sm text-[#F5F5F5]/60">@{user.username}</p>
              {user.isFamilyLinked ? (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#FF5A2F]">
                  Family-linked account
                </p>
              ) : null}
              {user.relationship === 'PENDING_MANAGER_APPROVAL' ? (
                <p className="mt-2 text-sm text-[#F5F5F5]/60">
                  Waiting for family approval.
                </p>
              ) : null}
            </div>
            {user.relationship === 'INCOMING_REQUEST' && user.requestId ? (
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 disabled:opacity-60"
                disabled={busy}
                onClick={() => acceptRequestMutation.mutate(user.requestId!)}
                type="button"
              >
                {acceptRequestMutation.isPending ? 'Working...' : relationshipLabel(user.relationship)}
              </button>
            ) : null}
            {user.relationship === 'OUTGOING_REQUEST' && user.requestId ? (
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 disabled:opacity-60"
                disabled={busy}
                onClick={() => cancelRequestMutation.mutate(user.requestId!)}
                type="button"
              >
                {cancelRequestMutation.isPending ? 'Working...' : 'Cancel request'}
              </button>
            ) : null}
            {user.relationship === 'NONE' ? (
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 disabled:opacity-60"
                disabled={busy}
                onClick={() => sendRequestMutation.mutate(user.id)}
                type="button"
              >
                {sendRequestMutation.isPending ? 'Working...' : relationshipLabel(user.relationship)}
              </button>
            ) : null}
            {user.relationship === 'CONNECTED' ? (
              <span className="rounded-full bg-[#FF5A2F] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#0D0D0D]">
                {relationshipLabel(user.relationship)}
              </span>
            ) : null}
            {user.relationship === 'PENDING_MANAGER_APPROVAL' ? (
              <span className="rounded-full bg-[#FF5A2F]/10 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#FF5A2F]">
                {relationshipLabel(user.relationship)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </PageCard>
  );
};







