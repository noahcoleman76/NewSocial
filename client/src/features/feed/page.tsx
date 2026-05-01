import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assetUrl } from '@/lib/api';
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

const formatFeedDate = (value: string) => {
  const date = new Date(value);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';

  return `${date.toLocaleString(undefined, { month: 'short' })} ${day}${suffix}, ${date.getFullYear()}`;
};

const FeedIcon = ({ name }: { name: FeedIconName }) => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
    <path d={iconPaths[name]} />
  </svg>
);

const ImageIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
    <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z" />
    <path d="m4 16 4.5-4.5a2 2 0 0 1 2.8 0L17 17" />
    <path d="m14 14 1.2-1.2a2 2 0 0 1 2.8 0L20 15" />
    <path d="M8.5 8.5h.01" />
  </svg>
);

export const FeedPage = () => {
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  const selectedPhotoPreviews = useMemo(
    () =>
      files.map((file, index) => ({
        file,
        index,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(
    () => () => {
      selectedPhotoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [selectedPhotoPreviews],
  );

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

  const addSelectedPhotos = (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) {
      return;
    }

    setFiles((current) => [...current, ...Array.from(selectedFiles)].slice(0, 5));
  };

  const canSubmitPost = Boolean(caption.trim() || files.length);

  return (
    <div className="space-y-6">
      <PageCard title="Create post">
        {!composerOpen ? (
          <button
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
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
              className="h-32 w-full resize-none rounded-[1.5rem] border border-white/10 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              maxLength={1000}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Write a post"
              value={caption}
            />
            <div className="space-y-3">
              <input
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                multiple
                onChange={(event) => {
                  addSelectedPhotos(event.target.files);
                  event.target.value = '';
                }}
                ref={photoInputRef}
                type="file"
              />
              {files.length < 5 ? (
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text)]/85 transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                  onClick={() => photoInputRef.current?.click()}
                  type="button"
                >
                  <ImageIcon />
                  Add photos
                </button>
              ) : null}
              {selectedPhotoPreviews.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedPhotoPreviews.map((preview) => (
                    <div key={`${preview.file.name}-${preview.file.size}-${preview.index}`} className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/7">
                      <img alt="" className="h-36 w-full object-cover" src={preview.url} />
                      <button
                        aria-label={`Remove ${preview.file.name}`}
                        className="absolute right-2 top-2 rounded-full bg-[var(--accent-contrast)]/80 px-3 py-1 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                        onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== preview.index))}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {createPostMutation.isError ? (
              <p className="text-sm text-[var(--accent)]">Could not create post.</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-60"
                disabled={createPostMutation.isPending || !canSubmitPost}
                type="submit"
              >
                {createPostMutation.isPending ? 'Posting...' : 'Post'}
              </button>
              <button
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text)]/75 transition hover:bg-white/12"
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
        {feedQuery.isLoading ? <p className="text-sm text-[var(--text)]/60">Loading...</p> : null}
        {feedQuery.isError ? <p className="text-sm text-[var(--accent)]">Could not load feed.</p> : null}
        {reportStatus ? (
          <p className={`mb-4 text-sm ${reportStatus === 'Post reported for admin review.' ? 'text-[var(--accent)]' : 'text-[var(--accent)]'}`}>
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
                        <Link className="font-medium text-[var(--text)] hover:underline" to={`/profile/${item.author.username}`}>
                          {item.author.displayName}
                        </Link>

                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text)]/45">
                        {formatFeedDate(item.createdAt)}
                      </p>
                    </div>
                    {item.caption ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]/85">{item.caption}</p> : null}
                    {item.images.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {item.images.map((imageUrl) => (
                          <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-white/10 object-cover" src={assetUrl(imageUrl) ?? imageUrl} />
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--text)]/60">
                      <div className="flex flex-wrap gap-3">
                        <button
                          aria-label={item.likedByMe ? 'Unlike post' : 'Like post'}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text)]/85 transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] disabled:opacity-60"
                          disabled={likeMutation.isPending}
                          onClick={() => likeMutation.mutate({ postId: item.postId, likedByMe: item.likedByMe })}
                          type="button"
                        >
                          <span className={item.likedByMe ? 'text-[var(--accent)]' : undefined}>
                            <FeedIcon name="like" />
                          </span>
                          <span>{item.likeCount}</span>
                        </button>
                        <Link
                          aria-label="Open comments"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[var(--text)]/85 transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                          to={`/post/${item.postId}`}
                        >
                          <FeedIcon name="comment" />
                          <span>{item.commentCount}</span>
                        </Link>
                      </div>
                      <div className="relative">
                        <button
                          aria-label="Post options"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[var(--text)]/75 transition hover:bg-white/12"
                          onClick={() => setOpenPostMenuId((current) => (current === item.postId ? null : item.postId))}
                          type="button"
                        >
                          <FeedIcon name="more" />
                        </button>
                        {openPostMenuId === item.postId ? (
                          <div className="absolute bottom-12 right-0 z-10 min-w-36 rounded-2xl border border-white/10 bg-[var(--bg-card)] p-2 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.8)]">
                            {item.canDelete ? (
                              <button
                                className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--accent)] transition hover:bg-white/12 disabled:opacity-60"
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
                                className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--text)]/85 transition hover:bg-white/12 disabled:opacity-60"
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
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--text)]/45">Sponsored placement</p>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--text)]/75">{item.body}</p>
                  </article>
                ),
              )}
            </div>
            <p className="mt-6 text-center text-sm text-[var(--text)]/60">{feedQuery.data.endMessage}</p>
          </>
        ) : null}
      </PageCard>
    </div>
  );
};










