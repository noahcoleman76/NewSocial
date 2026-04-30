import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assetUrl } from '@/lib/api';
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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [conversationQuery.data?.messages.length]);

  useEffect(() => {
    if (!accessToken || !conversationId) {
      return;
    }

    const socket = getMessageSocket(accessToken);
    const markActiveConversationOpen = (payload: { conversationId: string }) => {
      if (payload.conversationId !== conversationId) {
        return;
      }

      void api.post(`/conversations/${conversationId}/open`).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      });
    };

    socket.on('message:new', markActiveConversationOpen);

    return () => {
      socket.off('message:new', markActiveConversationOpen);
    };
  }, [accessToken, conversationId, queryClient]);

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
  const recipientLabel = participant ? `@${participant.username}` : 'Deleted User';

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#211f1d]/92 shadow-[0_24px_90px_-60px_rgba(255,90,47,0.42)]">
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/10 bg-[#211f1d]/95 px-4 py-4 shadow-[0_18px_35px_-30px_rgba(0,0,0,0.85)] backdrop-blur">
        <Link
          className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#F5F5F5]/80 transition hover:border-[#FF5A2F]/40 hover:bg-[#FF5A2F]/10 hover:text-[#FF5A2F]"
          to="/messages"
        >
          Inbox
        </Link>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#F5F5F5]">{recipientLabel}</p>
          {participant ? <p className="truncate text-sm text-[#F5F5F5]/55">{participant.displayName}</p> : null}
        </div>
      </div>

      {conversationQuery.isLoading ? <p className="p-4 text-sm text-[#F5F5F5]/60">Loading conversation...</p> : null}
      {conversationQuery.isError ? <p className="p-4 text-sm text-[#FF5A2F]">Could not load conversation.</p> : null}
      {conversationQuery.data ? (
        <>
          <div className="min-h-[58vh] space-y-2 px-4 py-5 pb-8">
            {conversationQuery.data.messages.length ? (
              conversationQuery.data.messages.map((message) => (
                <div key={message.id} className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-[1.35rem] px-3 py-2 text-sm leading-6 shadow-[0_14px_38px_-30px_rgba(0,0,0,0.9)] ${
                      message.isMine
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
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5 text-sm leading-7 text-[#F5F5F5]/75">
                No messages yet.
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="sticky bottom-0 z-10 border-t border-white/10 bg-[#211f1d]/95 px-4 py-4 backdrop-blur"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitError(null);
              sendMutation.mutate();
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#171514] p-2">
              <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#F5F5F5]/70 transition hover:bg-white/10 hover:text-[#FF5A2F]">
                <span className="sr-only">Add images</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z" />
                  <path d="m4 16 4.5-4.5a2 2 0 0 1 2.8 0L17 17" />
                  <path d="M8.5 8.5h.01" />
                </svg>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  multiple
                  onChange={(event) => {
                    setFiles(Array.from(event.target.files ?? []).slice(0, 3));
                    event.target.value = '';
                  }}
                  type="file"
                />
              </label>
              <input
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#F5F5F5] outline-none placeholder:text-[#F5F5F5]/45"
                maxLength={1000}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Message"
                value={body}
              />
              <button
                className="shrink-0 rounded-full bg-[#FF5A2F] px-4 py-2 text-sm font-medium text-[#0D0D0D] transition hover:bg-[#ff704d] disabled:opacity-50"
                disabled={sendMutation.isPending || (!body.trim() && files.length === 0)}
                type="submit"
              >
                {sendMutation.isPending ? 'Sending' : 'Send'}
              </button>
            </div>
            {files.length ? (
              <p className="mt-2 px-3 text-xs text-[#F5F5F5]/55">
                {files.length} image{files.length === 1 ? '' : 's'} ready to send
              </p>
            ) : null}
            {submitError ? <p className="mt-2 px-3 text-sm text-[#FF5A2F]">{submitError}</p> : null}
          </form>
        </>
      ) : null}
    </section>
  );
};












