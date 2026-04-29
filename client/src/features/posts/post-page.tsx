import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
      setReportStatus('Report submitted for admin review.');
    },
    onError: () => {
      setReportStatus('Could not submit this report right now.');
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
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={handleBack}
        type="button"
      >
        Back to feed
      </button>
      <PageCard title="Post" subtitle="Comments are oldest-first. You can delete your own posts and comments.">
      {postQuery.isLoading ? <p className="text-sm text-slate-500">Loading post...</p> : null}
      {postQuery.isError ? <p className="text-sm text-rose-600">Could not load this post right now.</p> : null}
      {post ? (
        <>
          <article className="rounded-[1.5rem] border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link className="font-medium text-slate-900 hover:underline" to={`/profile/${post.author.username}`}>
                  {post.author.displayName}
                </Link>
                <p className="text-sm text-slate-500">@{post.author.username}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
            {post.caption ? <p className="mt-3 text-sm leading-7 text-slate-700">{post.caption}</p> : null}
            {post.images.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {post.images.map((imageUrl) => (
                  <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-slate-200 object-cover" src={imageUrl} />
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
                disabled={likeMutation.isPending}
                onClick={() => likeMutation.mutate(post.likedByMe)}
                type="button"
              >
                {post.likedByMe ? 'Unlike' : 'Like'} · {post.likeCount}
              </button>
              <span className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500">
                {post.commentCount} comments
              </span>
              {post.canDelete ? (
                <button
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700 disabled:opacity-60"
                  disabled={deletePostMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this post?')) {
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
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
                  disabled={reportPostMutation.isPending}
                  onClick={handleReportPost}
                  type="button"
                >
                  {reportPostMutation.isPending ? 'Reporting...' : 'Report post'}
                </button>
              ) : null}
            </div>
            {reportStatus ? (
              <p className={`mt-4 text-sm ${reportStatus === 'Report submitted for admin review.' ? 'text-emerald-700' : 'text-rose-600'}`}>
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
              className="min-h-28 w-full rounded-[1.5rem] border border-slate-200 px-4 py-3"
              maxLength={1000}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Write a comment"
              value={commentBody}
            />
            {createCommentMutation.isError ? (
              <p className="text-sm text-rose-600">Could not add your comment right now.</p>
            ) : null}
            <button
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              disabled={createCommentMutation.isPending || !commentBody.trim()}
              type="submit"
            >
              {createCommentMutation.isPending ? 'Posting...' : 'Add comment'}
            </button>
          </form>
          <div className="mt-4 space-y-3">
            {(postQuery.data?.comments ?? []).map((comment) => (
              <div key={comment.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{comment.author.displayName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {comment.canDelete ? (
                    <button
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-700 disabled:opacity-60"
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


