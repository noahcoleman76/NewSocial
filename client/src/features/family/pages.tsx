import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
              <p className="text-xs uppercase tracking-[0.22em] text-[#F5F5F5]/45">Family code</p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.18em] text-[#F5F5F5]">
                {codeQuery.data.value}
              </p>
              <p className="mt-2 text-sm text-[#F5F5F5]/60">Use this during signup.</p>
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
                <p className="font-medium text-[#F5F5F5]">{child.displayName}</p>
                <p className="mt-1 text-sm text-[#F5F5F5]/60">@{child.username}</p>
                <p className="mt-3 text-sm text-[#F5F5F5]/75">{child.email}</p>
                {child.pendingApprovalCount ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#FF5A2F]">
                    {child.pendingApprovalCount} parent approval
                    {child.pendingApprovalCount === 1 ? '' : 's'} pending
                  </p>
                ) : null}
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#F5F5F5]/45">
                  Joined {new Date(child.createdAt).toLocaleDateString()}
                </p>
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
      <PageCard title="Child account">
        {childQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading child account...</p> : null}
        {childQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load child account.</p> : null}
        {childQuery.data ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
              <p className="font-medium text-[#F5F5F5]">{childQuery.data.displayName}</p>
              <p className="mt-1 text-sm text-[#F5F5F5]/60">@{childQuery.data.username}</p>
              <p className="mt-3 text-sm text-[#F5F5F5]/75">{childQuery.data.email}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#F5F5F5]/45">
                Joined {new Date(childQuery.data.createdAt).toLocaleDateString()}
              </p>
              {childQuery.data.bio ? <p className="mt-4 text-sm leading-7 text-[#F5F5F5]/75">{childQuery.data.bio}</p> : null}
            </div>
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
              <div className="space-y-4">
                {messagesQuery.data.conversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-[1.5rem] border border-white/10 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#F5F5F5]">
                          {conversation.participant?.displayName ?? 'Deleted User'}
                        </p>
                        <p className="mt-1 text-sm text-[#F5F5F5]/60">
                          {conversation.participant?.deleted
                            ? 'Deleted user.'
                            : conversation.participant?.isFamilyLinked
                              ? `@${conversation.participant.username} · Family-linked account`
                              : conversation.participant
                                ? `@${conversation.participant.username}`
                                : 'Account removed'}
                        </p>
                      </div>
                      {conversation.unread ? (
                        <span className="rounded-full bg-[#FF5A2F] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#0D0D0D]">
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-3">
                      {conversation.messages.map((message) => (
                        <div key={message.id} className="rounded-[1.25rem] border border-white/10 bg-white/7 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-medium text-[#F5F5F5]/85">{message.author.name}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-[#F5F5F5]/75">
                            {message.body ?? 'Image-only message'}
                          </p>
                          {message.imageCount > 0 ? (
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                              {message.imageCount} image{message.imageCount === 1 ? '' : 's'}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
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

export const FamilyChildConnectionsPage = () => {
  const { childId = '' } = useParams();
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-6">
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
                      <p className="font-medium text-[#F5F5F5]">{request.user.displayName}</p>
                      <p className="mt-1 text-sm text-[#F5F5F5]/60">@{request.user.username}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                        Waiting since {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 disabled:opacity-60"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => approveMutation.mutate(request.id)}
                          type="button"
                        >
                          {approveMutation.isPending ? 'Approving...' : 'Approve connection'}
                        </button>
                        <button
                          className="rounded-full border border-[#FF5A2F]/35 px-4 py-2 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
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
              {connectionsQuery.data.connections.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {connectionsQuery.data.connections.map((connection) => (
                    <div key={connection.id} className="rounded-[1.5rem] border border-white/10 p-4">
                      <p className="font-medium text-[#F5F5F5]">{connection.user.displayName}</p>
                      <p className="mt-1 text-sm text-[#F5F5F5]/60">@{connection.user.username}</p>
                      {connection.user.isFamilyLinked ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">Family-linked account</p>
                      ) : null}
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                        Connected {new Date(connection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
                  No connections yet.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </PageCard>
    </div>
  );
};









