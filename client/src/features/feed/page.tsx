import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';
import type { FeedItem } from '@shared/types/domain';

type FeedResponse = {
  items: FeedItem[];
  endMessage: string;
};
type FeedIconName = 'like' | 'comment' | 'more';

const iconPaths: Record<FeedIconName, string> = {
  like: 'M7 10v10M7 10H4.5A1.5 1.5 0 0 0 3 11.5v7A1.5 1.5 0 0 0 4.5 20H7m0-10 4-6a2 2 0 0 1 3.7 1.1L14 9h4.5a2 2 0 0 1 2 2.3l-1.1 7A2 2 0 0 1 17.4 20H7',
  comment: 'M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4.2A2.5 2.5 0 0 1 5 12.5v-6Z',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
};

const FeedIcon = ({ name }: { name: FeedIconName }) => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
    <path d={iconPaths[name]} />
  </svg>
);

export const FeedPage = () => {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  const feedQuery = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await api.get<FeedResponse>('/feed');
      return data;
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('caption', caption);
      files.forEach((file) => formData.append('images', file));

      await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: async () => {
      setCaption('');
      setFiles([]);
      setComposerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, likedByMe }: { postId: string; likedByMe: boolean }) => {
      if (likedByMe) {
        await api.delete(`/posts/${postId}/like`);
        return;
      }

      await api.post(`/posts/${postId}/like`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });

  const reportPostMutation = useMutation({
    mutationFn: async ({ postId, reason, message }: { postId: string; reason: string; message?: string }) => {
      await api.post('/reports', {
        targetType: 'POST',
        targetId: postId,
        reason,
        message,
      });
    },
    onSuccess: () => {
      setReportStatus('Post reported for admin review.');
    },
    onError: () => {
      setReportStatus('Could not report post.');
    },
  });

  const handleReportPost = (postId: string) => {
    const reason = window.prompt('Reason for reporting this post');
    if (!reason?.trim()) {
      return;
    }

    const detail = window.prompt('Optional note for the admin');
    setReportStatus(null);
    setOpenPostMenuId(null);
    reportPostMutation.mutate({
      postId,
      reason: reason.trim(),
      message: detail?.trim() || undefined,
    });
  };
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });

  return (
    <div className="space-y-6">
      <PageCard title="Create post">
        {!composerOpen ? (
          <button
            className="rounded-full bg-[#FF5A2F] px-5 py-3 text-sm font-medium text-[#0D0D0D] transition hover:bg-[#ff704d]"
            onClick={() => setComposerOpen(true)}
            type="button"
          >
            Create post
          </button>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createPostMutation.mutate();
            }}
          >
            <textarea
              className="min-h-32 w-full rounded-[1.5rem] border border-white/10 px-4 py-3 outline-none transition focus:border-[#FF5A2F]"
              maxLength={1000}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Write a post"
              value={caption}
            />
            <div className="space-y-3">
              <input
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))}
                type="file"
              />
              {files.length ? (
                <div className="flex flex-wrap gap-2 text-sm text-[#F5F5F5]/60">
                  {files.map((file) => (
                    <span key={`${file.name}-${file.size}`} className="rounded-full bg-white/12 px-3 py-1">
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {createPostMutation.isError ? (
              <p className="text-sm text-[#FF5A2F]">Could not create post.</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[#FF5A2F] px-5 py-3 text-sm font-medium text-[#0D0D0D] disabled:opacity-60"
                disabled={createPostMutation.isPending}
                type="submit"
              >
                {createPostMutation.isPending ? 'Posting...' : 'Post'}
              </button>
              <button
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[#F5F5F5]/75 transition hover:bg-white/12"
                onClick={() => {
                  setCaption('');
                  setFiles([]);
                  setComposerOpen(false);
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </PageCard>
      <PageCard title="Feed">
        {feedQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading...</p> : null}
        {feedQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load feed.</p> : null}
        {reportStatus ? (
          <p className={`mb-4 text-sm ${reportStatus === 'Post reported for admin review.' ? 'text-[#FF5A2F]' : 'text-[#FF5A2F]'}`}>
            {reportStatus}
          </p>
        ) : null}
        {feedQuery.data ? (
          <>
            <div className="space-y-4">
              {feedQuery.data.items.map((item) =>
                item.type === 'post' ? (
                  <article key={item.postId} className="rounded-[1.5rem] border border-white/10 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link className="font-medium text-[#F5F5F5] hover:underline" to={`/profile/${item.author.username}`}>
                          {item.author.displayName}
                        </Link>

                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#F5F5F5]/45">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {item.caption ? <p className="mt-4 text-sm leading-7 text-[#F5F5F5]/85">{item.caption}</p> : null}
                    {item.images.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {item.images.map((imageUrl) => (
                          <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-white/10 object-cover" src={imageUrl} />
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#F5F5F5]/60">
                      <div className="flex flex-wrap gap-3">
                        <button
                          aria-label={item.likedByMe ? 'Unlike post' : 'Like post'}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/85 disabled:opacity-60"
                          disabled={likeMutation.isPending}
                          onClick={() => likeMutation.mutate({ postId: item.postId, likedByMe: item.likedByMe })}
                          type="button"
                        >
                          <FeedIcon name="like" />
                          <span>{item.likeCount}</span>
                        </button>
                        <Link
                          aria-label="Open comments"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[#F5F5F5]/85"
                          to={`/post/${item.postId}`}
                        >
                          <FeedIcon name="comment" />
                          <span>{item.commentCount}</span>
                        </Link>
                      </div>
                      <div className="relative">
                        <button
                          aria-label="Post options"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#F5F5F5]/75 transition hover:bg-white/12"
                          onClick={() => setOpenPostMenuId((current) => (current === item.postId ? null : item.postId))}
                          type="button"
                        >
                          <FeedIcon name="more" />
                        </button>
                        {openPostMenuId === item.postId ? (
                          <div className="absolute bottom-12 right-0 z-10 min-w-36 rounded-2xl border border-white/10 bg-[#211f1d] p-2 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.8)]">
                            {item.canDelete ? (
                              <button
                                className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#FF5A2F] transition hover:bg-white/12 disabled:opacity-60"
                                disabled={deletePostMutation.isPending}
                                onClick={() => {
                                  if (window.confirm('Delete this post?')) {
                                    setOpenPostMenuId(null);
                                    deletePostMutation.mutate(item.postId);
                                  }
                                }}
                                type="button"
                              >
                                {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                              </button>
                            ) : (
                              <button
                                className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#F5F5F5]/85 transition hover:bg-white/12 disabled:opacity-60"
                                disabled={reportPostMutation.isPending}
                                onClick={() => handleReportPost(item.postId)}
                                type="button"
                              >
                                {reportPostMutation.isPending ? 'Reporting...' : 'Report'}
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ) : (
                  <article key={item.id} className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/7 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#F5F5F5]/45">Sponsored placement</p>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#F5F5F5]/75">{item.body}</p>
                  </article>
                ),
              )}
            </div>
            <p className="mt-6 text-center text-sm text-[#F5F5F5]/60">{feedQuery.data.endMessage}</p>
          </>
        ) : null}
      </PageCard>
    </div>
  );
};










