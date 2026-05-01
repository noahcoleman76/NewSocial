import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assetUrl } from '@/lib/api';
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
  `rounded-full px-4 py-2 text-sm transition ${active ? 'bg-[#FF5A2F] text-[#0D0D0D]' : 'border border-white/10 text-[#F5F5F5]/75 hover:bg-white/12/5'}`;

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
      setPostReportStatus('Could not report post.');
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
      setReportStatus('Could not report account.');
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
      setAdminActionStatus('Could not update account.');
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
      setAdminActionStatus('Could not promote account.');
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
      <PageCard title="Profile">
        {profileQuery.isLoading ? <p className="text-sm text-[#F5F5F5]/60">Loading profile...</p> : null}
        {profileQuery.isError ? <p className="text-sm text-[#FF5A2F]">Could not load profile.</p> : null}
        {profile ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              {profile.profileImageUrl ? (
                <img alt="" className="h-20 w-20 rounded-full object-cover" src={assetUrl(profile.profileImageUrl) ?? profile.profileImageUrl} />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/12 text-xl font-semibold text-[#F5F5F5]/60">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-semibold text-[#F5F5F5]">{profile.displayName}</h2>
                  <p className="text-sm text-[#F5F5F5]/60">@{profile.username}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.isFamilyLinked ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-[#FF5A2F]">Family-linked account</p>
                  ) : null}
                  {profile.accountStatus === 'DISABLED' ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-[#FF5A2F]">Disabled account</p>
                  ) : null}
                </div>
                <p className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-[#F5F5F5]/75">
                  {profile.bio || 'No bio.'}
                </p>
              </div>
            </div>
            {!profile.isSelf ? (
              <>
                <div className="flex flex-wrap gap-3">
                {profile.relationship === 'NONE' && profile.accountStatus === 'ACTIVE' ? (
                  <button
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 disabled:opacity-60"
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
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 disabled:opacity-60"
                      disabled={messageMutation.isPending}
                      onClick={() => messageMutation.mutate(profile.id)}
                      type="button"
                    >
                      {messageMutation.isPending ? 'Opening...' : 'Message'}
                    </button>
                    <button
                      className="rounded-full border border-[#FF5A2F]/35 px-4 py-2 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
                      disabled={disconnectMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Disconnect from ${profile.displayName}?`)) {
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
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F5F5]/85 disabled:opacity-60"
                      disabled={messageMutation.isPending}
                      onClick={() => messageMutation.mutate(profile.id)}
                      type="button"
                    >
                      {messageMutation.isPending ? 'Opening...' : 'Message'}
                    </button>
                    <span className="rounded-full bg-white/12 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/75">
                      Family connection
                    </span>
                  </>
                ) : null}
                {profile.relationship === 'INCOMING_REQUEST' ? (
                  <span className="rounded-full bg-white/12 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#F5F5F5]/75">
                    Accept from Connections
                  </span>
                ) : null}
                {profile.relationship === 'OUTGOING_REQUEST' ? (
                  <span className="rounded-full bg-[#FF5A2F] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#0D0D0D]">
                    Request pending
                  </span>
                ) : null}
                {profile.relationship === 'PENDING_MANAGER_APPROVAL' ? (
                  <span className="rounded-full bg-[#FF5A2F]/10 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#FF5A2F]">
                    Waiting for family approval
                  </span>
                ) : null}
                {profile.canPromoteToAdmin ? (
                  <button
                    className="rounded-full border border-slate-900 bg-[#FF5A2F] px-4 py-2 text-sm font-medium text-[#0D0D0D] disabled:opacity-60"
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
                    className="rounded-full border border-[#FF5A2F]/35 bg-[#FF5A2F]/10 px-4 py-2 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
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
                    className="rounded-full border border-[#FF5A2F]/35 bg-[#FF5A2F]/10 px-4 py-2 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
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
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#F5F5F5]/75 disabled:opacity-60"
                  disabled={reportAccountMutation.isPending}
                  onClick={() => handleReportAccount(profile.id)}
                  type="button"
                >
                  {reportAccountMutation.isPending ? 'Reporting...' : 'Report account'}
                </button>
              </div>
              {adminActionStatus ? (
                <p className={`text-sm ${['Account promoted to admin.', 'Account disabled.', 'Account enabled.'].includes(adminActionStatus) ? 'text-[#FF5A2F]' : 'text-[#FF5A2F]'}`}>
                  {adminActionStatus}
                </p>
              ) : null}
              {reportStatus ? (
                <p className={`text-sm ${reportStatus === 'Account reported.' ? 'text-[#FF5A2F]' : 'text-[#FF5A2F]'}`}>
                  {reportStatus}
                </p>
              ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </PageCard>
      {profile && profile.canSeePosts ? (
        <PageCard title="Posts">
          {postReportStatus ? (
            <p className={`mb-4 text-sm ${postReportStatus === 'Post reported for admin review.' ? 'text-[#FF5A2F]' : 'text-[#FF5A2F]'}`}>
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
                <article key={post.id} className="rounded-[1.5rem] border border-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#F5F5F5]/45">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  {post.caption ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#F5F5F5]/85">{post.caption}</p> : null}
                  {post.images.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {post.images.map((imageUrl) => (
                        <img key={imageUrl} alt="" className="rounded-[1.25rem] border border-white/10 object-cover" src={assetUrl(imageUrl) ?? imageUrl} />
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#F5F5F5]/60">
                    <button
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/85 disabled:opacity-60"
                      disabled={likeMutation.isPending}
                      onClick={() => likeMutation.mutate({ postId: post.id, likedByMe: post.likedByMe })}
                      type="button"
                    >
                      {post.likedByMe ? 'Unlike' : 'Like'} · {post.likeCount}
                    </button>
                    <Link className="rounded-full border border-white/10 px-4 py-2" to={`/post/${post.id}`}>
                      {post.commentCount} comments
                    </Link>
                    {post.canDelete ? (
                      <button
                        className="rounded-full border border-[#FF5A2F]/35 px-4 py-2 text-sm text-[#FF5A2F] disabled:opacity-60"
                        disabled={deletePostMutation.isPending}
                        onClick={() => {
                          if (window.confirm('Delete this post?')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        type="button"
                      >
                        {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    ) : (
                      <button
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/75 disabled:opacity-60"
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
            <p className="text-sm text-[#F5F5F5]/60">No posts here.</p>
          )}
        </PageCard>
      ) : null}
    </div>
  );
};
















