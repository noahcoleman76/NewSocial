import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';
import { useAuthStore } from '@/app/auth-store';
import { getMessageSocket } from './socket';

type ConversationParticipant = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  deleted: boolean;
  isFamilyLinked: boolean;
};

type ConversationSummary = {
  id: string;
  participant: ConversationParticipant | null;
  unread: boolean;
  updatedAt: string;
  preview: string;
};

type ConversationMessage = {
  id: string;
  body: string | null;
  createdAt: string;
  author: {
    id: string | null;
    name: string;
  };
  imageUrls: string[];
  imageCount: number;
  isMine: boolean;
};

type ConversationDetail = ConversationSummary & {
  messages: ConversationMessage[];
};

type ConversationsResponse = {
  conversations: ConversationSummary[];
};

type ConversationResponse = {
  conversation: ConversationDetail;
};

type ConnectionListResponse = {
  connections: Array<{
    id: string;
    createdAt: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      profileImageUrl: string | null;
      isFamilyLinked: boolean;
      isFamilyConnection?: boolean;
    };
  }>;
};

const summaryLabel = (participant: ConversationParticipant | null) => {
  if (!participant) {
    return 'Deleted User';
  }

  return participant.displayName;
};

const useMessageRealtime = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = getMessageSocket(accessToken);

    const handleConversationUpdated = (payload: { conversationId: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });

      if (!conversationId || payload.conversationId === conversationId) {
        void queryClient.invalidateQueries({ queryKey: ['conversation', payload.conversationId] });
      }
    };

    const handleMessageCreated = (payload: { conversationId: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });

      if (!conversationId || payload.conversationId === conversationId) {
        void queryClient.invalidateQueries({ queryKey: ['conversation', payload.conversationId] });
      }
    };

    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('message:new', handleMessageCreated);

    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('message:new', handleMessageCreated);
    };
  }, [accessToken, conversationId, queryClient]);
};

export const MessagesPage = () => {
  useMessageRealtime();

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get<ConversationsResponse>('/conversations');
      return data.conversations;
    },
  });

  return (
    <PageCard title="Messages">
      <div className="mb-5 flex items-center justify-end gap-4">
        <Link
          className="rounded-full bg-[#FF5A2F] px-4 py-2 text-sm font-medium text-[#0D0D0D] transition hover:bg-[#ff704d]"
          to="/messages/new"
        >
          New message
        </Link>
      </div>
      {conversationsQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading conversations...</p> : null}
      {conversationsQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load conversations.</p> : null}
      {conversationsQuery.data?.length ? (
        <div className="space-y-3">
          {conversationsQuery.data.map((conversation) => (
            <Link
              key={conversation.id}
              className="block rounded-[1.5rem] border border-white/10 p-4 transition hover:bg-white/12/5"
              to={`/messages/${conversation.id}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{summaryLabel(conversation.participant)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                    {new Date(conversation.updatedAt).toLocaleString()}
                  </p>
                </div>
                {conversation.unread ? (
                  <span className="rounded-full bg-[#FF5A2F] px-2 py-1 text-xs text-[#0D0D0D]">Unread</span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-[#F5F5F5]/60">{conversation.preview}</p>
            </Link>
          ))}
        </div>
      ) : null}
      {conversationsQuery.data && conversationsQuery.data.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
          No conversations yet.
        </div>
      ) : null}
    </PageCard>
  );
};

export const NewMessagePage = () => {
  useMessageRealtime();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const connectionsQuery = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data } = await api.get<ConnectionListResponse>('/connections');
      return data.connections;
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post<ConversationResponse>('/conversations', { userId });
      return data.conversation;
    },
    onSuccess: async (conversation) => {
      navigate(`/messages/${conversation.id}`);
    },
  });

  const filteredConnections = useMemo(() => {
    const term = query.trim().toLowerCase();
    const connections = connectionsQuery.data ?? [];

    if (!term) {
      return connections;
    }

    return connections.filter((connection) => {
      const haystack = `${connection.user.displayName} ${connection.user.username}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [connectionsQuery.data, query]);

  return (
    <PageCard title="New message">
      <div className="space-y-5">
        <input
          className="w-full rounded-[1.5rem] border border-white/10 px-4 py-3"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search connected people"
          value={query}
        />

        {connectionsQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading connections...</p> : null}
        {connectionsQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load connections.</p> : null}

        {filteredConnections.length ? (
          <div className="space-y-3">
            {filteredConnections.map((connection) => (
              <button
                key={connection.id}
                className="flex w-full items-center justify-between rounded-[1.5rem] border border-white/10 p-4 text-left transition hover:bg-white/12/5 disabled:opacity-60"
                disabled={createConversationMutation.isPending}
                onClick={() => createConversationMutation.mutate(connection.user.id)}
                type="button"
              >
                <div>
                  <p className="font-medium text-[#F5F5F5]">{connection.user.displayName}</p>
                  <p className="mt-1 text-sm text-[#F5F5F5]/60">@{connection.user.username}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/60">
                  Message
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {connectionsQuery.data && filteredConnections.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
            No matches.
          </div>
        ) : null}
      </div>
    </PageCard>
  );
};

export const ConversationPage = () => {
  useMessageRealtime(useParams().conversationId);

  const queryClient = useQueryClient();
  const { conversationId = '' } = useParams();
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const { data } = await api.get<ConversationResponse>(`/conversations/${conversationId}`);
      return data.conversation;
    },
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    void api.post(`/conversations/${conversationId}/open`).then(() => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    });
  }, [conversationId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (body.trim()) {
        formData.append('body', body.trim());
      }

      files.forEach((file) => {
        formData.append('images', file);
      });

      await api.post(`/conversations/${conversationId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: async () => {
      setBody('');
      setFiles([]);
      setSubmitError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] }),
      ]);
    },
    onError: () => {
      setSubmitError('Could not send message.');
    },
  });

  const participant = conversationQuery.data?.participant;

  return (
    <PageCard title="Conversation" subtitle={participant ? `Messaging ${participant.displayName}` : 'Direct message'}>
      {conversationQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading conversation...</p> : null}
      {conversationQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load conversation.</p> : null}
      {conversationQuery.data ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[#F5F5F5]">{participant ? participant.displayName : 'Deleted User'}</p>
              <p className="mt-1 text-sm text-[#F5F5F5]/60">
                {participant ? `@${participant.username}` : 'Account removed'}
              </p>
            </div>
            <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/85" to="/messages">
              Back to inbox
            </Link>
          </div>
          <div className="space-y-3">
            {conversationQuery.data.messages.length ? (
              conversationQuery.data.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[1.5rem] border p-4 ${
                    message.isMine ? 'border-white/10 bg-white/7' : 'border-white/10 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-[#F5F5F5]/60">{message.author.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {message.body ? <p className="mt-2">{message.body}</p> : null}
                  {message.imageUrls.length ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {message.imageUrls.map((imageUrl) => (
                        <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-white/10 object-cover" src={imageUrl} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
                No messages yet.
              </div>
            )}
          </div>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitError(null);
              sendMutation.mutate();
            }}
          >
            <textarea
              className="min-h-28 w-full rounded-[1.5rem] border border-white/10 px-4 py-3"
              maxLength={1000}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write a message"
              value={body}
            />
            <label className="block cursor-pointer rounded-full border border-white/10 px-4 py-3 text-center text-sm font-medium text-[#F5F5F5]/85 transition hover:bg-white/12/5">
              Choose up to 3 images
              <input
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 3))}
                type="file"
              />
            </label>
            {files.length ? (
              <p className="text-sm text-[#F5F5F5]/60">
                {files.length} image{files.length === 1 ? '' : 's'} ready to send
              </p>
            ) : null}
            {submitError ? <p className="text-sm text-[#FF5A2F]">{submitError}</p> : null}
            <button
              className="rounded-full bg-[#FF5A2F] px-5 py-3 text-sm font-medium text-[#0D0D0D] disabled:opacity-60"
              disabled={sendMutation.isPending || (!body.trim() && files.length === 0)}
              type="submit"
            >
              {sendMutation.isPending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        </>
      ) : null}
    </PageCard>
  );
};











