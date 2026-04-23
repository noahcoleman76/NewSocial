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
  incomingRequests: FamilyConnectionRequestItem[];
  outgoingRequests: FamilyConnectionRequestItem[];
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
      <PageCard
        title="Family"
        subtitle="Manage a family from here. Share your fixed family code when you want a new child account linked under your management."
      >
        <div className="space-y-4">
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Any standard account can manage family-linked child accounts. Use your family code in the normal create-account
            form for the child. A valid code creates the new account as a child account connected to you.
          </p>
          {codeQuery.isLoading ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              Loading your family code...
            </div>
          ) : null}
          {codeQuery.data ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Family code</p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.18em] text-slate-900">
                {codeQuery.data.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">This code stays fixed for your account until we add code rotation.</p>
            </div>
          ) : null}
          {codeQuery.isError ? <p className="text-sm text-rose-600">Could not load your family code right now.</p> : null}
        </div>
      </PageCard>
      <PageCard title="Linked Children" subtitle="Accounts created with your family code appear here.">
        {childrenQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading child accounts...</p>
        ) : null}
        {childrenQuery.isError ? (
          <p className="text-sm text-rose-600">Could not load linked child accounts right now.</p>
        ) : null}
        {childrenQuery.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {childrenQuery.data.map((child) => (
              <Link
                key={child.id}
                className="rounded-[1.5rem] border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50"
                to={`/family/child/${child.id}`}
              >
                <p className="font-medium text-slate-900">{child.displayName}</p>
                <p className="mt-1 text-sm text-slate-500">@{child.username}</p>
                <p className="mt-3 text-sm text-slate-600">{child.email}</p>
                {child.pendingApprovalCount ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-700">
                    {child.pendingApprovalCount} parent approval
                    {child.pendingApprovalCount === 1 ? '' : 's'} pending
                  </p>
                ) : null}
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  Joined {new Date(child.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : null}
        {childrenQuery.data && childrenQuery.data.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            No child accounts are linked yet. Share your family code on the create-account page to connect a new child account here.
          </div>
        ) : null}
      </PageCard>
      <PageCard title="How Family Signup Works" subtitle="There is now one account-creation flow for everyone.">
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>1. Open this page and copy your family code.</p>
          <p>2. Open the normal create-account page.</p>
          <p>3. Fill in email, username, display name, password, and the optional family code.</p>
          <p>4. If the code is valid, the new account becomes a child account linked to you.</p>
        </div>
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
      <PageCard title="Child account" subtitle="Release this account into a standard account or delete it permanently.">
        {childQuery.isLoading ? <p className="text-sm text-slate-500">Loading child account...</p> : null}
        {childQuery.isError ? <p className="text-sm text-rose-600">Could not load this child account right now.</p> : null}
        {childQuery.data ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="font-medium text-slate-900">{childQuery.data.displayName}</p>
              <p className="mt-1 text-sm text-slate-500">@{childQuery.data.username}</p>
              <p className="mt-3 text-sm text-slate-600">{childQuery.data.email}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                Joined {new Date(childQuery.data.createdAt).toLocaleDateString()}
              </p>
              {childQuery.data.bio ? <p className="mt-4 text-sm leading-7 text-slate-600">{childQuery.data.bio}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                to={`/family/child/${childQuery.data.id}/messages`}
              >
                View child messages
              </Link>
              <Link
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                to={`/family/child/${childQuery.data.id}/connections`}
              >
                View child connections
              </Link>
              <button
                className="rounded-full border border-amber-200 px-5 py-3 text-sm font-medium text-amber-700 disabled:opacity-60"
                disabled={releaseMutation.isPending || deleteMutation.isPending}
                onClick={handleRelease}
                type="button"
              >
                {releaseMutation.isPending ? 'Releasing...' : 'Release child account'}
              </button>
              <button
                className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700 disabled:opacity-60"
                disabled={releaseMutation.isPending || deleteMutation.isPending}
                onClick={handleDelete}
                type="button"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete child account'}
              </button>
            </div>
            {releaseMutation.isError ? (
              <p className="text-sm text-rose-600">Could not release this child account right now.</p>
            ) : null}
            {deleteMutation.isError ? (
              <p className="text-sm text-rose-600">Could not delete this child account right now.</p>
            ) : null}
          </div>
        ) : null}
      </PageCard>
      <PageCard title="What These Actions Do" subtitle="These controls change the account relationship, not just the current view.">
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>Release converts the child account into a standard account and removes it from your family.</p>
          <p>Delete permanently removes the child account from the platform.</p>
          <p>Only standard accounts with linked children can manage family accounts.</p>
        </div>
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
      <PageCard
        title="Child messages"
        subtitle="Family manager visibility is read-only and covers all direct messages for this linked child account."
      >
        {messagesQuery.isLoading ? <p className="text-sm text-slate-500">Loading child messages...</p> : null}
        {messagesQuery.isError ? <p className="text-sm text-rose-600">Could not load child messages right now.</p> : null}
        {messagesQuery.data ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="font-medium text-slate-900">{messagesQuery.data.child.displayName}</p>
              <p className="mt-1 text-sm text-slate-500">@{messagesQuery.data.child.username}</p>
              <p className="mt-3 text-sm text-slate-600">
                Read-only message visibility for linked child accounts. No read receipts or manager replies.
              </p>
            </div>
            {messagesQuery.data.conversations.length ? (
              <div className="space-y-4">
                {messagesQuery.data.conversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {conversation.participant?.displayName ?? 'Deleted User'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {conversation.participant?.deleted
                            ? 'This conversation includes a deleted user.'
                            : conversation.participant?.isFamilyLinked
                              ? `@${conversation.participant.username} · Family-linked account`
                              : conversation.participant
                                ? `@${conversation.participant.username}`
                                : 'Account removed'}
                        </p>
                      </div>
                      {conversation.unread ? (
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white">
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-3">
                      {conversation.messages.map((message) => (
                        <div key={message.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-medium text-slate-700">{message.author.name}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {message.body ?? 'Image-only message'}
                          </p>
                          {message.imageCount > 0 ? (
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
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
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                This child account does not have any conversations yet.
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
      <PageCard
        title="Child connections"
        subtitle="Review accepted connections and pending requests for this linked child account."
      >
        {connectionsQuery.isLoading ? <p className="text-sm text-slate-500">Loading child connections...</p> : null}
        {connectionsQuery.isError ? (
          <p className="text-sm text-rose-600">Could not load child connections right now.</p>
        ) : null}
        {connectionsQuery.data ? (
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="font-medium text-slate-900">{connectionsQuery.data.child.displayName}</p>
              <p className="mt-1 text-sm text-slate-500">@{connectionsQuery.data.child.username}</p>
              <p className="mt-3 text-sm text-slate-600">
                Family-linked requests require manager approval before the child can officially connect or see the other account's posts in profile and feed.
              </p>
            </div>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Pending parent approval</h3>
              {connectionsQuery.data.pendingApprovals.length ? (
                <div className="grid gap-3">
                  {connectionsQuery.data.pendingApprovals.map((request) => (
                    <div key={request.id} className="rounded-[1.5rem] border border-amber-200 bg-amber-50/50 p-4">
                      <p className="font-medium text-slate-900">{request.user.displayName}</p>
                      <p className="mt-1 text-sm text-slate-500">@{request.user.username}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Waiting since {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => approveMutation.mutate(request.id)}
                          type="button"
                        >
                          {approveMutation.isPending ? 'Approving...' : 'Approve connection'}
                        </button>
                        <button
                          className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
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
                <p className="text-sm text-slate-500">No child connections are waiting for your approval right now.</p>
              )}
              {approveMutation.isError ? (
                <p className="text-sm text-rose-600">Could not approve this child connection right now.</p>
              ) : null}
              {rejectMutation.isError ? (
                <p className="text-sm text-rose-600">Could not reject this child connection right now.</p>
              ) : null}
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Connected accounts</h3>
              {connectionsQuery.data.connections.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {connectionsQuery.data.connections.map((connection) => (
                    <div key={connection.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                      <p className="font-medium text-slate-900">{connection.user.displayName}</p>
                      <p className="mt-1 text-sm text-slate-500">@{connection.user.username}</p>
                      {connection.user.isFamilyLinked ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">Family-linked account</p>
                      ) : null}
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Connected {new Date(connection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  This child account does not have any active connections yet.
                </div>
              )}
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Incoming requests</h3>
              {connectionsQuery.data.incomingRequests.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {connectionsQuery.data.incomingRequests.map((request) => (
                    <div key={request.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                      <p className="font-medium text-slate-900">{request.user.displayName}</p>
                      <p className="mt-1 text-sm text-slate-500">@{request.user.username}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No incoming requests right now.</p>
              )}
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Outgoing requests</h3>
              {connectionsQuery.data.outgoingRequests.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {connectionsQuery.data.outgoingRequests.map((request) => (
                    <div key={request.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                      <p className="font-medium text-slate-900">{request.user.displayName}</p>
                      <p className="mt-1 text-sm text-slate-500">@{request.user.username}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
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
