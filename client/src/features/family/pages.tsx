import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assetUrl } from '@/lib/api';
import { PageCard } from '@/components/page-card';

type FamilyCodeResponse = {
  code: {
    value: string;
  } | null;
};

type FamilyChild = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  profileImageUrl?: string | null;
  createdAt: string;
  pendingApprovalCount?: number;
};

type FamilyChildrenResponse = {
  children: FamilyChild[];
};

type FamilyChildResponse = {
  child: FamilyChild & {
    bio: string | null;
    profileImageUrl: string | null;
  };
};

type FamilyMessageAuthor = {
  id: string | null;
  name: string;
};

type FamilyMessage = {
  id: string;
  body: string | null;
  createdAt: string;
  author: FamilyMessageAuthor;
  imageCount: number;
  imageUrls: string[];
};

type FamilyMessageConversation = {
  id: string;
  participant: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
    role: 'STANDARD' | 'CHILD' | 'ADMIN';
    isFamilyLinked: boolean;
    deleted: boolean;
  } | null;
  unread: boolean;
  messages: FamilyMessage[];
};

type FamilyChildMessagesResponse = {
  child: FamilyChild & {
    bio: string | null;
    profileImageUrl: string | null;
  };
  conversations: FamilyMessageConversation[];
};

type FamilyConnectionUser = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  role: 'STANDARD' | 'CHILD' | 'ADMIN';
  isFamilyLinked: boolean;
};

type FamilyConnectionItem = {
  id: string;
  user: FamilyConnectionUser;
  createdAt: string;
};

type FamilyConnectionRequestItem = {
  id: string;
  user: FamilyConnectionUser;
  createdAt: string;
};

type FamilyChildConnectionsResponse = {
  child: FamilyChild & {
    bio: string | null;
    profileImageUrl: string | null;
  };
  connections: FamilyConnectionItem[];
  pendingApprovals: FamilyConnectionRequestItem[];
};

export const FamilyPage = () => {
  const codeQuery = useQuery({
    queryKey: ['family', 'code'],
    queryFn: async () => {
      const { data } = await api.get<FamilyCodeResponse>('/family/code');
      return data.code;
    },
  });

  const childrenQuery = useQuery({
    queryKey: ['family', 'children'],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildrenResponse>('/family/children');
      return data.children;
    },
  });

  return (
    <div className="space-y-6">
      <PageCard title="Family">
        <div className="space-y-4">

          {codeQuery.isLoading ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5 text-sm text-[#F5F5F5]/60">
              Loading code...
            </div>
          ) : null}
          {codeQuery.data ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#F5F5F5]/45">Add Family Member</p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.18em] text-[#F5F5F5]">
                {codeQuery.data.value}
              </p>
              <p className="mt-2 text-sm text-[#F5F5F5]/60">
                Use this code when creating a family member account you will manage.
              </p>
            </div>
          ) : null}
          {codeQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load code.</p> : null}
        </div>
      </PageCard>
      <PageCard title="Linked Children">
        {childrenQuery.isLoading ? (
          <p className="text-sm text-[#F5F5F5]/60">Loading...</p>
        ) : null}
        {childrenQuery.isError ? (
          <p className="text-sm text-[#FF5A2F]">Could not load children.</p>
        ) : null}
        {childrenQuery.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {childrenQuery.data.map((child) => (
              <Link
                key={child.id}
                className="rounded-[1.5rem] border border-white/10 p-5 transition hover:border-white/15 hover:bg-white/12/5"
                to={`/family/child/${child.id}`}
              >
                <div className="flex items-center gap-3">
                  {child.profileImageUrl ? (
                    <img
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                      src={assetUrl(child.profileImageUrl) ?? child.profileImageUrl}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-[#F5F5F5]/65">
                      {child.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#F5F5F5]">{child.displayName}</p>
                    <p className="mt-1 truncate text-sm text-[#F5F5F5]/60">@{child.username}</p>
                  </div>
                </div>
                {child.pendingApprovalCount ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#FF5A2F]">
                    {child.pendingApprovalCount} parent approval
                    {child.pendingApprovalCount === 1 ? '' : 's'} pending
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : null}
        {childrenQuery.data && childrenQuery.data.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
            No child accounts yet.
          </div>
        ) : null}
      </PageCard>

    </div>
  );
};

export const FamilyChildPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { childId = '' } = useParams();

  const childQuery = useQuery({
    queryKey: ['family', 'children', childId],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildResponse>(`/family/children/${childId}`);
      return data.child;
    },
    enabled: Boolean(childId),
  });
  const childConnectionsQuery = useQuery({
    queryKey: ['family', 'children', childId, 'connections'],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildConnectionsResponse>(`/family/children/${childId}/connections`);
      return data;
    },
    enabled: Boolean(childId),
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/family/children/${childId}/release`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family', 'children'] });
      navigate('/family', { replace: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/family/children/${childId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family', 'children'] });
      navigate('/family', { replace: true });
    },
  });

  const handleRelease = () => {
    if (!childQuery.data) {
      return;
    }

    const confirmed = window.confirm(
      `Release ${childQuery.data.displayName} from your family? This will convert the account into a standard account.`,
    );

    if (confirmed) {
      releaseMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (!childQuery.data) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${childQuery.data.displayName} permanently? This action cannot be undone.`,
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/85 transition hover:border-[#FF5A2F]/40 hover:bg-[#FF5A2F]/10 hover:text-[#FF5A2F]"
        to="/family"
      >
        Back to family
      </Link>
      <PageCard title="Child account">
        {childQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading child account...</p> : null}
        {childQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load child account.</p> : null}
        {childQuery.data ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
              <div className="flex items-center gap-4">
                {childQuery.data.profileImageUrl ? (
                  <img
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                    src={assetUrl(childQuery.data.profileImageUrl) ?? childQuery.data.profileImageUrl}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/12 text-lg font-semibold text-[#F5F5F5]/65">
                    {childQuery.data.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#F5F5F5]">{childQuery.data.displayName}</p>
                  <Link
                    className="mt-1 block truncate text-sm text-[#F5F5F5]/60 transition hover:text-[#FF5A2F] hover:underline"
                    to={`/profile/${childQuery.data.username}`}
                  >
                    @{childQuery.data.username}
                  </Link>
                </div>
              </div>
              {childQuery.data.bio ? <p className="mt-4 text-sm leading-7 text-[#F5F5F5]/75">{childQuery.data.bio}</p> : null}
            </div>
            {childConnectionsQuery.data?.pendingApprovals.length ? (
              <div className="rounded-[1.5rem] border border-[#FF5A2F]/35 bg-[#FF5A2F]/10 p-5">
                <p className="text-sm font-medium text-[#F5F5F5]">
                  {childConnectionsQuery.data.pendingApprovals.length} connection approval
                  {childConnectionsQuery.data.pendingApprovals.length === 1 ? '' : 's'} needed
                </p>
                <div className="mt-4 grid gap-3">
                  {childConnectionsQuery.data.pendingApprovals.map((approval) => (
                    <Link
                      key={approval.id}
                      className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#211f1d]/70 p-3 transition hover:border-[#FF5A2F]/35 hover:bg-[#FF5A2F]/10"
                      to={`/profile/${approval.user.username}`}
                    >
                      {approval.user.profileImageUrl ? (
                        <img
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                          src={assetUrl(approval.user.profileImageUrl) ?? approval.user.profileImageUrl}
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-[#F5F5F5]/65">
                          {approval.user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#F5F5F5]">{approval.user.displayName}</p>
                        <p className="truncate text-xs text-[#F5F5F5]/60">@{approval.user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  className="mt-4 inline-flex rounded-full bg-[#FF5A2F] px-4 py-2 text-sm font-medium text-[#0D0D0D]"
                  to={`/family/child/${childQuery.data.id}/connections`}
                >
                  Review approvals
                </Link>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[#F5F5F5]/85 transition hover:bg-white/12/5"
                to={`/family/child/${childQuery.data.id}/messages`}
              >
                View child messages
              </Link>
              <Link
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[#F5F5F5]/85 transition hover:bg-white/12/5"
                to={`/family/child/${childQuery.data.id}/connections`}
              >
                View child connections
              </Link>
              <button
                className="rounded-full border border-[#FF5A2F]/35 px-5 py-3 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
                disabled={releaseMutation.isPending || deleteMutation.isPending}
                onClick={handleRelease}
                type="button"
              >
                {releaseMutation.isPending ? 'Releasing...' : 'Release child account'}
              </button>
              <button
                className="rounded-full border border-[#FF5A2F]/35 px-5 py-3 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
                disabled={releaseMutation.isPending || deleteMutation.isPending}
                onClick={handleDelete}
                type="button"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete child account'}
              </button>
            </div>
            {releaseMutation.isError ? (
              <p className="text-sm text-[#FF5A2F]">Could not release account.</p>
            ) : null}
            {deleteMutation.isError ? (
              <p className="text-sm text-[#FF5A2F]">Could not delete account.</p>
            ) : null}
          </div>
        ) : null}
      </PageCard>

    </div>
  );
};

export const FamilyChildMessagesPage = () => {
  const { childId = '' } = useParams();

  const messagesQuery = useQuery({
    queryKey: ['family', 'children', childId, 'messages'],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildMessagesResponse>(`/family/children/${childId}/messages`);
      return data;
    },
    enabled: Boolean(childId),
  });

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/85 transition hover:border-[#FF5A2F]/40 hover:bg-[#FF5A2F]/10 hover:text-[#FF5A2F]"
        to={`/family/child/${childId}`}
      >
        Back to child account
      </Link>
      <PageCard title="Child messages">
        {messagesQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading child messages...</p> : null}
        {messagesQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load messages.</p> : null}
        {messagesQuery.data ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
              <p className="font-medium text-[#F5F5F5]">{messagesQuery.data.child.displayName}</p>
              <p className="mt-1 text-sm text-[#F5F5F5]/60">@{messagesQuery.data.child.username}</p>

            </div>
            {messagesQuery.data.conversations.length ? (
              <div className="space-y-3">
                {messagesQuery.data.conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    className="block rounded-[1.5rem] border border-white/10 p-5 transition hover:border-[#FF5A2F]/35 hover:bg-[#FF5A2F]/10"
                    to={`/family/child/${childId}/messages/${conversation.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {conversation.participant?.profileImageUrl ? (
                          <img
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                            src={assetUrl(conversation.participant.profileImageUrl) ?? conversation.participant.profileImageUrl}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-[#F5F5F5]/65">
                            {(conversation.participant?.displayName ?? 'D').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#F5F5F5]">
                            {conversation.participant?.displayName ?? 'Deleted User'}
                          </p>
                          <p className="mt-1 truncate text-sm text-[#F5F5F5]/60">
                            {conversation.participant?.deleted
                              ? 'Deleted user.'
                              : conversation.participant?.isFamilyLinked
                                ? `@${conversation.participant.username} · Family-linked account`
                                : conversation.participant
                                  ? `@${conversation.participant.username}`
                                  : 'Account removed'}
                          </p>
                        </div>
                      </div>
                      {conversation.unread ? (
                        <span className="rounded-full bg-[#FF5A2F] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#0D0D0D]">
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 truncate text-sm text-[#F5F5F5]/60">
                      {conversation.messages.at(-1)?.body ??
                        (conversation.messages.at(-1)?.imageCount ? 'Image message' : 'No messages yet.')}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
                No conversations yet.
              </div>
            )}
          </div>
        ) : null}
      </PageCard>
    </div>
  );
};

export const FamilyChildConversationPage = () => {
  const { childId = '', conversationId = '' } = useParams();

  const messagesQuery = useQuery({
    queryKey: ['family', 'children', childId, 'messages'],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildMessagesResponse>(`/family/children/${childId}/messages`);
      return data;
    },
    enabled: Boolean(childId),
  });

  const conversation = messagesQuery.data?.conversations.find((entry) => entry.id === conversationId);
  const participant = conversation?.participant;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#211f1d]/92 shadow-[0_24px_90px_-60px_rgba(255,90,47,0.42)]">
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/10 bg-[#211f1d]/95 px-4 py-4 shadow-[0_18px_35px_-30px_rgba(0,0,0,0.85)] backdrop-blur">
        <Link
          className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#F5F5F5]/80 transition hover:border-[#FF5A2F]/40 hover:bg-[#FF5A2F]/10 hover:text-[#FF5A2F]"
          to={`/family/child/${childId}/messages`}
        >
          Back
        </Link>
        <div className="min-w-0">
          {participant ? (
            <Link
              className="block truncate text-base font-semibold text-[#F5F5F5] transition hover:text-[#FF5A2F] hover:underline"
              to={`/profile/${participant.username}`}
            >
              @{participant.username}
            </Link>
          ) : (
            <p className="truncate text-base font-semibold text-[#F5F5F5]">Deleted User</p>
          )}
          <p className="truncate text-sm text-[#F5F5F5]/55">
            {participant?.displayName ?? 'Account removed'} and {messagesQuery.data?.child.displayName ?? 'child account'}
          </p>
        </div>
      </div>

      {messagesQuery.isLoading ? <p className="p-4 text-sm text-[#F5F5F5]/60">Loading conversation...</p> : null}
      {messagesQuery.isError ? <p className="p-4 text-sm text-[#FF5A2F]">Could not load conversation.</p> : null}
      {messagesQuery.data && !conversation ? (
        <p className="p-4 text-sm text-[#F5F5F5]/60">Conversation not found.</p>
      ) : null}
      {conversation ? (
        <div className="min-h-[58vh] space-y-2 px-4 py-5">
          {conversation.messages.map((message) => {
            const isChildMessage = message.author.id === childId;

            return (
              <div key={message.id} className={`flex ${isChildMessage ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-[1.35rem] px-3 py-2 text-sm leading-6 shadow-[0_14px_38px_-30px_rgba(0,0,0,0.9)] ${
                    isChildMessage
                      ? 'rounded-br-md bg-[#E4572E] text-white'
                      : 'rounded-bl-md bg-white/10 text-[#F5F5F5]'
                  }`}
                  title={new Date(message.createdAt).toLocaleString()}
                >
                  {message.imageUrls.length ? (
                    <div className="grid gap-2">
                      {message.imageUrls.map((imageUrl) => (
                        <img
                          key={imageUrl}
                          alt=""
                          className="max-h-80 w-full rounded-[1rem] object-contain"
                          src={assetUrl(imageUrl) ?? imageUrl}
                        />
                      ))}
                    </div>
                  ) : null}
                  {message.body ? (
                    <p className={message.imageUrls.length ? 'mt-2 whitespace-pre-wrap' : 'whitespace-pre-wrap'}>
                      {message.body}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export const FamilyChildConnectionsPage = () => {
  const { childId = '' } = useParams();
  const queryClient = useQueryClient();
  const [connectionSearch, setConnectionSearch] = useState('');

  const connectionsQuery = useQuery({
    queryKey: ['family', 'children', childId, 'connections'],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildConnectionsResponse>(`/family/children/${childId}/connections`);
      return data;
    },
    enabled: Boolean(childId),
  });

  const approveMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await api.post(`/family/children/${childId}/connections/${connectionId}/approve`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['family', 'children'] }),
        queryClient.invalidateQueries({ queryKey: ['family', 'children', childId, 'connections'] }),
      ]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await api.post(`/family/children/${childId}/connections/${connectionId}/reject`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['family', 'children'] }),
        queryClient.invalidateQueries({ queryKey: ['family', 'children', childId, 'connections'] }),
      ]);
    },
  });
  const removeConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await api.delete(`/family/children/${childId}/connections/${connectionId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['family', 'children'] }),
        queryClient.invalidateQueries({ queryKey: ['family', 'children', childId, 'connections'] }),
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    },
  });
  const filteredConnections = (connectionsQuery.data?.connections ?? []).filter((connection) => {
    const term = connectionSearch.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return `${connection.user.displayName} ${connection.user.username}`.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/85 transition hover:border-[#FF5A2F]/40 hover:bg-[#FF5A2F]/10 hover:text-[#FF5A2F]"
        to={`/family/child/${childId}`}
      >
        Back to child account
      </Link>
      <PageCard title="Child connections">
        {connectionsQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading child connections...</p> : null}
        {connectionsQuery.isError ? (
          <p className="text-sm text-[#FF5A2F]">Could not load connections.</p>
        ) : null}
        {connectionsQuery.data ? (
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
              <p className="font-medium text-[#F5F5F5]">{connectionsQuery.data.child.displayName}</p>
              <p className="mt-1 text-sm text-[#F5F5F5]/60">@{connectionsQuery.data.child.username}</p>

            </div>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-[#F5F5F5]/60">Pending parent approval</h3>
              {connectionsQuery.data.pendingApprovals.length ? (
                <div className="grid gap-3">
                  {connectionsQuery.data.pendingApprovals.map((request) => (
                    <div key={request.id} className="rounded-[1.5rem] border border-[#FF5A2F]/35 bg-[#FF5A2F]/10 p-4">
                      <Link
                        className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#211f1d]/70 p-3 transition hover:border-[#FF5A2F]/35 hover:bg-[#FF5A2F]/10"
                        to={`/profile/${request.user.username}`}
                      >
                        {request.user.profileImageUrl ? (
                          <img
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                            src={assetUrl(request.user.profileImageUrl) ?? request.user.profileImageUrl}
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-[#F5F5F5]/65">
                            {request.user.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#F5F5F5]">{request.user.displayName}</p>
                          <p className="mt-1 truncate text-sm text-[#F5F5F5]/60">@{request.user.username}</p>
                        </div>
                      </Link>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                        Waiting since {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 transition hover:border-[#FF5A2F]/40 hover:bg-[#FF5A2F]/10 hover:text-[#FF5A2F] disabled:opacity-60"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => approveMutation.mutate(request.id)}
                          type="button"
                        >
                          {approveMutation.isPending ? 'Approving...' : 'Approve connection'}
                        </button>
                        <button
                          className="rounded-full border border-[#FF5A2F]/35 px-4 py-2 text-sm font-medium text-[#FF5A2F] transition hover:bg-[#FF5A2F] hover:text-[#0D0D0D] disabled:opacity-60"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(request.id)}
                          type="button"
                        >
                          {rejectMutation.isPending ? 'Rejecting...' : 'Reject connection'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#F5F5F5]/60">No approvals pending.</p>
              )}
              {approveMutation.isError ? (
                <p className="text-sm text-[#FF5A2F]">Could not approve connection.</p>
              ) : null}
              {rejectMutation.isError ? (
                <p className="text-sm text-[#FF5A2F]">Could not reject connection.</p>
              ) : null}
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-[#F5F5F5]/60">Connected accounts</h3>
              <input
                className="w-full rounded-[1.5rem] border border-white/10 bg-[#171514] px-4 py-3 text-sm text-[#F5F5F5] outline-none placeholder:text-[#F5F5F5]/45 focus:border-[#FF5A2F]"
                onChange={(event) => setConnectionSearch(event.target.value)}
                placeholder="Search child connections"
                value={connectionSearch}
              />
              {connectionsQuery.data.connections.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="rounded-[1.5rem] border border-white/10 p-4 transition hover:border-[#FF5A2F]/35 hover:bg-[#FF5A2F]/10"
                    >
                      <Link className="flex items-center gap-3" to={`/profile/${connection.user.username}`}>
                        {connection.user.profileImageUrl ? (
                          <img
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                            src={assetUrl(connection.user.profileImageUrl) ?? connection.user.profileImageUrl}
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-[#F5F5F5]/65">
                            {connection.user.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#F5F5F5]">{connection.user.displayName}</p>
                          <p className="mt-1 truncate text-sm text-[#F5F5F5]/60">@{connection.user.username}</p>
                        </div>
                      </Link>
                      {connection.user.isFamilyLinked ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">Family-linked account</p>
                      ) : null}
                      <button
                        className="mt-4 rounded-full border border-[#FF5A2F]/35 px-4 py-2 text-sm font-medium text-[#FF5A2F] transition hover:bg-[#FF5A2F] hover:text-[#0D0D0D] disabled:opacity-60"
                        disabled={removeConnectionMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Remove ${connection.user.displayName} from this child account's connections?`)) {
                            removeConnectionMutation.mutate(connection.id);
                          }
                        }}
                        type="button"
                      >
                        {removeConnectionMutation.isPending ? 'Removing...' : 'Remove connection'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
                  No connections yet.
                </div>
              )}
              {connectionsQuery.data.connections.length > 0 && filteredConnections.length === 0 ? (
                <p className="text-sm text-[#F5F5F5]/60">No matching connections.</p>
              ) : null}
              {removeConnectionMutation.isError ? (
                <p className="text-sm text-[#FF5A2F]">Could not remove connection.</p>
              ) : null}
            </section>
          </div>
        ) : null}
      </PageCard>
    </div>
  );
};










