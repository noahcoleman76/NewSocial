import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assetUrl } from '@/lib/api';
import { PageCard } from '@/components/page-card';

type PostComment = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  canDelete: boolean;
};

type PostResponse = {
  post: {
    id: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      profileImageUrl: string | null;
      isFamilyLinked: boolean;
    };
    caption: string | null;
    images: string[];
    likeCount: number;
    likedByMe: boolean;
    commentCount: number;
    canDelete: boolean;
  };
  comments: PostComment[];
};

export const PostPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { postId = '' } = useParams();
  const [commentBody, setCommentBody] = useState('');
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  const postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data } = await api.get<PostResponse>(`/posts/${postId}`);
      return data;
    },
    enabled: Boolean(postId),
  });

  const likeMutation = useMutation({
    mutationFn: async (likedByMe: boolean) => {
      if (likedByMe) {
        await api.delete(`/posts/${postId}/like`);
        return;
      }

      await api.post(`/posts/${postId}/like`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post', postId] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/posts/${postId}/comments`, { body: commentBody.trim() });
    },
    onSuccess: async () => {
      setCommentBody('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post', postId] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post', postId] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
      navigate('/feed', { replace: true });
    },
  });

  const reportPostMutation = useMutation({
    mutationFn: async ({ reason, message }: { reason: string; message?: string }) => {
      await api.post('/reports', {
        targetType: 'POST',
        targetId: postId,
        reason,
        message,
      });
    },
    onSuccess: () => {
      setReportStatus('Report submitted.');
    },
    onError: () => {
      setReportStatus('Could not submit report.');
    },
  });

  const handleReportPost = () => {
    const reason = window.prompt('Reason for reporting this post');
    if (!reason?.trim()) {
      return;
    }

    const detail = window.prompt('Optional note for the admin');
    setReportStatus(null);
    reportPostMutation.mutate({
      reason: reason.trim(),
      message: detail?.trim() || undefined,
    });
  };

  const post = postQuery.data?.post;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/feed');
  };

  return (
    <div className="space-y-4">
      <button
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[var(--text)]/85 hover:bg-white/12/5"
        onClick={handleBack}
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to feed
      </button>
      <PageCard title="Post">
      {postQuery.isLoading ? <p className="text-sm text-[var(--text)]/60">Loading post...</p> : null}
      {postQuery.isError ? <p className="text-sm text-[var(--accent)]">Could not load post.</p> : null}
      {post ? (
        <>
          <article className="rounded-[1.5rem] border border-white/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link className="font-medium text-[var(--text)] hover:underline" to={`/profile/${post.author.username}`}>
                  {post.author.displayName}
                </Link>
                <p className="text-sm text-[var(--text)]/60">@{post.author.username}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text)]/45">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
            {post.caption ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]/85">{post.caption}</p> : null}
            {post.images.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {post.images.map((imageUrl) => (
                  <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-white/10 object-cover" src={assetUrl(imageUrl) ?? imageUrl} />
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text)]/85 disabled:opacity-60"
                disabled={likeMutation.isPending}
                onClick={() => likeMutation.mutate(post.likedByMe)}
                type="button"
              >
                {post.likedByMe ? 'Unlike' : 'Like'} · {post.likeCount}
              </button>
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text)]/60">
                {post.commentCount} comments
              </span>
              {post.canDelete ? (
                <button
                  className="rounded-full border border-[var(--accent)]/35 px-4 py-2 text-sm text-[var(--accent)] disabled:opacity-60"
                  disabled={deletePostMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Delete this post?')) {
                      deletePostMutation.mutate();
                    }
                  }}
                  type="button"
                >
                  {deletePostMutation.isPending ? 'Deleting...' : 'Delete post'}
                </button>
              ) : null}
              {!post.canDelete ? (
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text)]/85 disabled:opacity-60"
                  disabled={reportPostMutation.isPending}
                  onClick={handleReportPost}
                  type="button"
                >
                  {reportPostMutation.isPending ? 'Reporting...' : 'Report post'}
                </button>
              ) : null}
            </div>
            {reportStatus ? (
              <p className={`mt-4 text-sm ${reportStatus === 'Report submitted.' ? 'text-[var(--accent)]' : 'text-[var(--accent)]'}`}>
                {reportStatus}
              </p>
            ) : null}
          </article>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!commentBody.trim()) {
                return;
              }
              createCommentMutation.mutate();
            }}
          >
            <textarea
              className="min-h-28 w-full rounded-[1.5rem] border border-white/10 px-4 py-3"
              maxLength={1000}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Write a comment"
              value={commentBody}
            />
            {createCommentMutation.isError ? (
              <p className="text-sm text-[var(--accent)]">Could not add comment.</p>
            ) : null}
            <button
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-60"
              disabled={createCommentMutation.isPending || !commentBody.trim()}
              type="submit"
            >
              {createCommentMutation.isPending ? 'Posting...' : 'Add comment'}
            </button>
          </form>
          <div className="mt-4 space-y-3">
            {(postQuery.data?.comments ?? []).map((comment) => (
              <div key={comment.id} className="rounded-[1.5rem] border border-white/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[var(--text)]/60">{comment.author.displayName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text)]/45">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {comment.canDelete ? (
                    <button
                      className="rounded-full border border-[var(--accent)]/35 px-3 py-1 text-xs text-[var(--accent)] disabled:opacity-60"
                      disabled={deleteCommentMutation.isPending}
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <p className="mt-1">{comment.body}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
      </PageCard>
    </div>
  );
};








