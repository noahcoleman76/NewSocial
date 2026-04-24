import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';

type ProfilePost = {
  id: string;
  caption: string | null;
  createdAt: string;
  images: string[];
  imageCount: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  canDelete: boolean;
};

type ProfileResponse = {
  profile: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    profileImageUrl: string | null;
    isFamilyLinked: boolean;
    isFamilyConnection?: boolean;
    isSelf: boolean;
    relationship: 'SELF' | 'NONE' | 'CONNECTED' | 'OUTGOING_REQUEST' | 'INCOMING_REQUEST' | 'PENDING_MANAGER_APPROVAL';
  };
  tabs: {
    feed: ProfilePost[];
    pictures: ProfilePost[];
    posts: ProfilePost[];
  };
};

const tabClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm transition ${active ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`;

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { username = '' } = useParams();
  const [activeTab, setActiveTab] = useState<'feed' | 'pictures' | 'posts'>('feed');

  const profileQuery = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await api.get<ProfileResponse>(`/users/${username}`);
      return data;
    },
    enabled: Boolean(username),
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      await api.post('/connections/requests', { receiverId });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', username] }),
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
      ]);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/connections/${userId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', username] }),
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
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
        queryClient.invalidateQueries({ queryKey: ['profile', username] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['post'] }),
      ]);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', username] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    },
  });

  const profile = profileQuery.data?.profile;
  const tabs = profileQuery.data?.tabs;
  const visiblePosts = tabs?.[activeTab] ?? [];

  return (
    <div className="space-y-6">
      <PageCard title="Profile" subtitle="Profiles show basic information first. Post visibility depends on an active connection.">
        {profileQuery.isLoading ? <p className="text-sm text-slate-500">Loading profile...</p> : null}
        {profileQuery.isError ? <p className="text-sm text-rose-600">Could not load this profile right now.</p> : null}
        {profile ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              {profile.profileImageUrl ? (
                <img alt="" className="h-20 w-20 rounded-full object-cover" src={profile.profileImageUrl} />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{profile.displayName}</h2>
                  <p className="text-sm text-slate-500">@{profile.username}</p>
                </div>
                {profile.isFamilyLinked ? (
                  <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Family-linked account</p>
                ) : null}
                <p className="max-w-2xl text-sm leading-7 text-slate-600">{profile.bio || 'No bio yet.'}</p>
              </div>
            </div>
            {!profile.isSelf ? (
              <div className="flex flex-wrap gap-3">
                {profile.relationship === 'NONE' ? (
                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                    disabled={sendRequestMutation.isPending}
                    onClick={() => sendRequestMutation.mutate(profile.id)}
                    type="button"
                  >
                    {sendRequestMutation.isPending ? 'Connecting...' : 'Connect'}
                  </button>
                ) : null}
                {profile.relationship === 'CONNECTED' && !profile.isFamilyConnection ? (
                  <button
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
                    disabled={disconnectMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to disconnect from ${profile.displayName}?`)) {
                        disconnectMutation.mutate(profile.id);
                      }
                    }}
                    type="button"
                  >
                    {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : null}
                {profile.relationship === 'CONNECTED' && profile.isFamilyConnection ? (
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-600">
                    Family connection
                  </span>
                ) : null}
                {profile.relationship === 'INCOMING_REQUEST' ? (
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-600">
                    Accept from Connections
                  </span>
                ) : null}
                {profile.relationship === 'OUTGOING_REQUEST' ? (
                  <span className="rounded-full bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white">
                    Request pending
                  </span>
                ) : null}
                {profile.relationship === 'PENDING_MANAGER_APPROVAL' ? (
                  <span className="rounded-full bg-amber-50 px-3 py-2 text-xs uppercase tracking-[0.16em] text-amber-700">
                    Waiting for family approval
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </PageCard>
      {profile && (profile.isSelf || profile.relationship === 'CONNECTED') ? (
        <PageCard title="Posts" subtitle="Profiles keep older posts visible even after they leave the main feed.">
          <div className="mb-4 flex flex-wrap gap-2">
            <button className={tabClass(activeTab === 'feed')} onClick={() => setActiveTab('feed')} type="button">
              Feed
            </button>
            <button className={tabClass(activeTab === 'pictures')} onClick={() => setActiveTab('pictures')} type="button">
              Pictures
            </button>
            <button className={tabClass(activeTab === 'posts')} onClick={() => setActiveTab('posts')} type="button">
              Posts
            </button>
          </div>
          {visiblePosts.length ? (
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <article key={post.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  {post.caption ? <p className="mt-3 text-sm leading-7 text-slate-700">{post.caption}</p> : null}
                  {post.images.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {post.images.map((imageUrl) => (
                        <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-slate-200 object-cover" src={imageUrl} />
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                    <button
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
                      disabled={likeMutation.isPending}
                      onClick={() => likeMutation.mutate({ postId: post.id, likedByMe: post.likedByMe })}
                      type="button"
                    >
                      {post.likedByMe ? 'Unlike' : 'Like'} · {post.likeCount}
                    </button>
                    <Link className="rounded-full border border-slate-200 px-4 py-2" to={`/post/${post.id}`}>
                      {post.commentCount} comments
                    </Link>
                    {post.canDelete ? (
                      <button
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700 disabled:opacity-60"
                        disabled={deletePostMutation.isPending}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this post?')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        type="button"
                      >
                        {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No posts to show in this tab yet.</p>
          )}
        </PageCard>
      ) : null}
    </div>
  );
};
