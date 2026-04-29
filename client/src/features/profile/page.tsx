import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
    role: 'STANDARD' | 'CHILD' | 'ADMIN';
    accountStatus: 'ACTIVE' | 'DISABLED' | 'DELETED';
    canPromoteToAdmin: boolean;
    canDisableAccount: boolean;
    canEnableAccount: boolean;
    canSeePosts: boolean;
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { username = '' } = useParams();
  const [activeTab, setActiveTab] = useState<'feed' | 'pictures' | 'posts'>('feed');
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [adminActionStatus, setAdminActionStatus] = useState<string | null>(null);
  const [postReportStatus, setPostReportStatus] = useState<string | null>(null);

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
      setPostReportStatus('Post reported for admin review.');
    },
    onError: () => {
      setPostReportStatus('Could not report this post right now.');
    },
  });

  const handleReportPost = (postId: string) => {
    const reason = window.prompt('Reason for reporting this post');
    if (!reason?.trim()) {
      return;
    }

    const detail = window.prompt('Optional note for the admin');
    setPostReportStatus(null);
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
        queryClient.invalidateQueries({ queryKey: ['profile', username] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    },
  });

  const messageMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.get<{ conversation: { id: string } }>(`/conversations/with/${userId}`);
      return data.conversation;
    },
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/messages/${conversation.id}`);
    },
  });


  const reportAccountMutation = useMutation({
    mutationFn: async (input: { accountId: string; reason: string; message?: string }) => {
      await api.post('/reports', {
        targetType: 'ACCOUNT',
        targetId: input.accountId,
        reason: input.reason,
        message: input.message,
      });
    },
    onSuccess: () => {
      setReportStatus('Account reported.');
    },
    onError: () => {
      setReportStatus('Could not report this account right now.');
    },
  });

  const moderateAccountMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'disable' | 'enable' }) => {
      await api.post(`/admin/users/${userId}/${action}`);
      return action;
    },
    onSuccess: async (action) => {
      setAdminActionStatus(action === 'disable' ? 'Account disabled.' : 'Account enabled.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', username] }),
        queryClient.invalidateQueries({ queryKey: ['admin-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    },
    onError: () => {
      setAdminActionStatus('Could not update this account right now.');
    },
  });
  const promoteAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/promote-admin`);
    },
    onSuccess: async () => {
      setAdminActionStatus('Account promoted to admin.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', username] }),
        queryClient.invalidateQueries({ queryKey: ['admin-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      ]);
    },
    onError: () => {
      setAdminActionStatus('Could not promote this account right now.');
    },
  });
  const handleReportAccount = (accountId: string) => {
    const reason = window.prompt('Reason for reporting this account');
    if (!reason?.trim()) {
      return;
    }

    const detail = window.prompt('Optional note for the admin');
    setReportStatus(null);
    reportAccountMutation.mutate({
      accountId,
      reason: reason.trim(),
      message: detail?.trim() || undefined,
    });
  };
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
                <div className="flex flex-wrap gap-2">
                  {profile.isFamilyLinked ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Family-linked account</p>
                  ) : null}
                  {profile.accountStatus === 'DISABLED' ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-rose-700">Disabled account</p>
                  ) : null}
                </div>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">{profile.bio || 'No bio yet.'}</p>
              </div>
            </div>
            {!profile.isSelf ? (
              <>
                <div className="flex flex-wrap gap-3">
                {profile.relationship === 'NONE' && profile.accountStatus === 'ACTIVE' ? (
                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                    disabled={sendRequestMutation.isPending}
                    onClick={() => sendRequestMutation.mutate(profile.id)}
                    type="button"
                  >
                    {sendRequestMutation.isPending ? 'Connecting...' : 'Connect'}
                  </button>
                ) : null}
                {profile.relationship === 'CONNECTED' && !profile.isFamilyConnection && profile.accountStatus === 'ACTIVE' ? (
                  <>
                    <button
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                      disabled={messageMutation.isPending}
                      onClick={() => messageMutation.mutate(profile.id)}
                      type="button"
                    >
                      {messageMutation.isPending ? 'Opening...' : 'Message'}
                    </button>
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
                  </>
                ) : null}
                {profile.relationship === 'CONNECTED' && profile.isFamilyConnection && profile.accountStatus === 'ACTIVE' ? (
                  <>
                    <button
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                      disabled={messageMutation.isPending}
                      onClick={() => messageMutation.mutate(profile.id)}
                      type="button"
                    >
                      {messageMutation.isPending ? 'Opening...' : 'Message'}
                    </button>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-600">
                      Family connection
                    </span>
                  </>
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
                {profile.canPromoteToAdmin ? (
                  <button
                    className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    disabled={promoteAdminMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Make ${profile.displayName} an admin?`)) {
                        setAdminActionStatus(null);
                        promoteAdminMutation.mutate(profile.id);
                      }
                    }}
                    type="button"
                  >
                    {promoteAdminMutation.isPending ? 'Promoting...' : 'Make admin'}
                  </button>
                ) : null}
                {profile.canDisableAccount ? (
                  <button
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
                    disabled={moderateAccountMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Disable ${profile.displayName}'s account? They will not be able to log in until an admin re-enables it.`)) {
                        setAdminActionStatus(null);
                        moderateAccountMutation.mutate({ userId: profile.id, action: 'disable' });
                      }
                    }}
                    type="button"
                  >
                    {moderateAccountMutation.isPending ? 'Updating...' : 'Disable account'}
                  </button>
                ) : null}
                {profile.canEnableAccount ? (
                  <button
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-60"
                    disabled={moderateAccountMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Re-enable ${profile.displayName}'s account?`)) {
                        setAdminActionStatus(null);
                        moderateAccountMutation.mutate({ userId: profile.id, action: 'enable' });
                      }
                    }}
                    type="button"
                  >
                    {moderateAccountMutation.isPending ? 'Updating...' : 'Enable account'}
                  </button>
                ) : null}
                <button
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-60"
                  disabled={reportAccountMutation.isPending}
                  onClick={() => handleReportAccount(profile.id)}
                  type="button"
                >
                  {reportAccountMutation.isPending ? 'Reporting...' : 'Report account'}
                </button>
              </div>
              {adminActionStatus ? (
                <p className={`text-sm ${['Account promoted to admin.', 'Account disabled.', 'Account enabled.'].includes(adminActionStatus) ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {adminActionStatus}
                </p>
              ) : null}
              {reportStatus ? (
                <p className={`text-sm ${reportStatus === 'Account reported.' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {reportStatus}
                </p>
              ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </PageCard>
      {profile && profile.canSeePosts ? (
        <PageCard title="Posts" subtitle="Profiles keep older posts visible even after they leave the main feed.">
          {postReportStatus ? (
            <p className={`mb-4 text-sm ${postReportStatus === 'Post reported for admin review.' ? 'text-emerald-700' : 'text-rose-600'}`}>
              {postReportStatus}
            </p>
          ) : null}
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
                    ) : (
                      <button
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-60"
                        disabled={reportPostMutation.isPending}
                        onClick={() => handleReportPost(post.id)}
                        type="button"
                      >
                        {reportPostMutation.isPending ? 'Reporting...' : 'Report post'}
                      </button>
                    )}
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










