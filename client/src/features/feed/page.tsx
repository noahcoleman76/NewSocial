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

export const FeedPage = () => {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [reportStatus, setReportStatus] = useState<string | null>(null);

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
      setReportStatus('Could not report this post right now.');
    },
  });

  const handleReportPost = (postId: string) => {
    const reason = window.prompt('Reason for reporting this post');
    if (!reason?.trim()) {
      return;
    }

    const detail = window.prompt('Optional note for the admin');
    setReportStatus(null);
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
      <PageCard title="Create post" subtitle="Write something, upload pictures, or do both.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createPostMutation.mutate();
          }}
        >
          <textarea
            className="min-h-32 w-full rounded-[1.5rem] border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
            maxLength={1000}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="What would you like to share?"
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
              <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                {files.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="rounded-full bg-slate-100 px-3 py-1">
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {createPostMutation.isError ? (
            <p className="text-sm text-rose-600">Could not create this post right now.</p>
          ) : null}
          <button
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            disabled={createPostMutation.isPending}
            type="submit"
          >
            {createPostMutation.isPending ? 'Posting...' : 'Post'}
          </button>
        </form>
      </PageCard>
      <PageCard title="Feed" subtitle="Chronological posts from mutual connections, limited to the last 14 days.">
        {feedQuery.isLoading ? <p className="text-sm text-slate-500">Loading feed...</p> : null}
        {feedQuery.isError ? <p className="text-sm text-rose-600">Could not load the feed right now.</p> : null}
        {reportStatus ? (
          <p className={`mb-4 text-sm ${reportStatus === 'Post reported for admin review.' ? 'text-emerald-700' : 'text-rose-600'}`}>
            {reportStatus}
          </p>
        ) : null}
        {feedQuery.data ? (
          <>
            <div className="space-y-4">
              {feedQuery.data.items.map((item) =>
                item.type === 'post' ? (
                  <article key={item.postId} className="rounded-[1.5rem] border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link className="font-medium text-slate-900 hover:underline" to={`/profile/${item.author.username}`}>
                          {item.author.displayName}
                        </Link>
                        <p className="text-sm text-slate-500">@{item.author.username}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {item.caption ? <p className="mt-4 text-sm leading-7 text-slate-700">{item.caption}</p> : null}
                    {item.images.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {item.images.map((imageUrl) => (
                          <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-slate-200 object-cover" src={imageUrl} />
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <button
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
                        disabled={likeMutation.isPending}
                        onClick={() => likeMutation.mutate({ postId: item.postId, likedByMe: item.likedByMe })}
                        type="button"
                      >
                        {item.likedByMe ? 'Unlike' : 'Like'} · {item.likeCount}
                      </button>
                      <Link className="rounded-full border border-slate-200 px-4 py-2" to={`/post/${item.postId}`}>
                        {item.commentCount} comments
                      </Link>
                      {item.canDelete ? (
                        <button
                          className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700 disabled:opacity-60"
                          disabled={deletePostMutation.isPending}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this post?')) {
                              deletePostMutation.mutate(item.postId);
                            }
                          }}
                          type="button"
                        >
                          {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      ) : (
                        <button
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-60"
                          disabled={reportPostMutation.isPending}
                          onClick={() => handleReportPost(item.postId)}
                          type="button"
                        >
                          {reportPostMutation.isPending ? 'Reporting...' : 'Report post'}
                        </button>
                      )}
                    </div>
                  </article>
                ) : (
                  <article key={item.id} className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Sponsored placement</p>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                  </article>
                ),
              )}
            </div>
            <p className="mt-6 text-center text-sm text-slate-500">{feedQuery.data.endMessage}</p>
          </>
        ) : null}
      </PageCard>
    </div>
  );
};

