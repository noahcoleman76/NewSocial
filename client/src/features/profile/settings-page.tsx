import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/app/auth-store';
import { PageCard } from '@/components/page-card';
import { api, assetUrl } from '@/lib/api';

type UpdateUserResponse = {
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    bio: string | null;
    role: 'STANDARD' | 'CHILD' | 'ADMIN';
    accountStatus: 'ACTIVE' | 'DISABLED' | 'DELETED';
    profileImageUrl: string | null;
    hasChildren?: boolean;
  };
};

type ChangePasswordResponse = {
  accessToken: string;
  user: UpdateUserResponse['user'];
};

const readErrorMessage = (error: unknown, fallback: string) =>
  error instanceof AxiosError
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? fallback)
    : fallback;

export const SettingsPage = () => {
  const bioMaxLength = 250;
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.currentUser);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const applySession = useAuthStore((state) => state.applySession);
  const logout = useAuthStore((state) => state.logout);
  const [profileFields, setProfileFields] = useState({
    displayName: '',
    username: '',
    email: '',
    bio: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPasswordValues, setShowPasswordValues] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [familyCode, setFamilyCode] = useState('');
  const [familyCodeMessage, setFamilyCodeMessage] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedImage) {
      return assetUrl(user?.profileImageUrl) ?? null;
    }

    return URL.createObjectURL(selectedImage);
  }, [selectedImage, user?.profileImageUrl]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileFields({
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      bio: user.bio ?? '',
    });
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | null> = {};

      if (profileFields.displayName.trim()) {
        payload.displayName = profileFields.displayName.trim();
      }

      if (profileFields.username.trim()) {
        payload.username = profileFields.username.trim().toLowerCase();
      }

      if (profileFields.email.trim()) {
        payload.email = profileFields.email.trim().toLowerCase();
      }

      if (profileFields.bio.trim() !== (user?.bio ?? '')) {
        payload.bio = profileFields.bio.trim() || null;
      }

      const { data } = await api.patch<UpdateUserResponse>('/users/me', payload);
      return data.user;
    },
    onSuccess: async (nextUser) => {
      setCurrentUser(nextUser);
      setProfileFields({
        displayName: nextUser.displayName,
        username: nextUser.username,
        email: nextUser.email,
        bio: nextUser.bio ?? '',
      });
      setProfileMessage('Profile saved.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
      ]);
    },
    onError: (error) => {
      setProfileMessage(readErrorMessage(error, 'Could not save profile.'));
    },
  });

  const imageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage) {
        throw new Error('No file selected');
      }

      const formData = new FormData();
      formData.append('image', selectedImage);
      const { data } = await api.patch<UpdateUserResponse>('/users/me/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.user;
    },
    onSuccess: async (nextUser) => {
      setCurrentUser(nextUser);
      setSelectedImage(null);
      setProfileMessage('Profile photo updated.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['user-search'] }),
      ]);
    },
    onError: (error) => {
      setProfileMessage(readErrorMessage(error, 'Could not update photo.'));
    },
  });


  const deleteAccountMutation = useMutation({
    mutationFn: async (childOutcome?: 'DELETE_CHILDREN' | 'RELEASE_CHILDREN') => {
      await api.delete('/users/me', {
        data: {
          childOutcome,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.clear();
      await logout().catch(() => undefined);
      window.location.assign('/login');
    },
    onError: (error) => {
      setDeleteMessage(readErrorMessage(error, 'Could not delete account.'));
    },
  });

  const familyCodeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<UpdateUserResponse>('/users/me/family-code', {
        familyCode: familyCode.trim(),
      });
      return data.user;
    },
    onSuccess: async (nextUser) => {
      setCurrentUser(nextUser);
      setFamilyCode('');
      setFamilyCodeMessage('Family linked.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['family'] }),
        queryClient.invalidateQueries({ queryKey: ['connections'] }),
      ]);
    },
    onError: (error) => {
      setFamilyCodeMessage(readErrorMessage(error, 'Could not apply family code.'));
    },
  });

  const handleDeleteAccount = (childOutcome?: 'DELETE_CHILDREN' | 'RELEASE_CHILDREN') => {
    const message = childOutcome === 'RELEASE_CHILDREN'
      ? 'Delete your account and release all child accounts into standard accounts? Permanent.'
      : childOutcome === 'DELETE_CHILDREN'
        ? 'Delete your account and all linked child accounts? Permanent.'
        : 'Delete your account permanently? Permanent.';

    if (window.confirm(message)) {
      setDeleteMessage(null);
      deleteAccountMutation.mutate(childOutcome);
    }
  };
  const passwordMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<ChangePasswordResponse>('/users/me/password', passwordFields);
      return data;
    },
    onSuccess: async (payload) => {
      applySession(payload);
      setPasswordFields({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordMessage('Password changed.');
      setShowPasswordFields(false);
      setShowPasswordValues(false);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      setPasswordMessage(readErrorMessage(error, 'Could not change password.'));
    },
  });

  const canApplyFamilyCode = user?.role === 'STANDARD' && !user.hasChildren;

  if (!user) {
    return null;
  }

  const canSaveProfile =
    profileFields.displayName.trim() !== user.displayName ||
    profileFields.username.trim().toLowerCase() !== user.username ||
    profileFields.email.trim().toLowerCase() !== user.email ||
    profileFields.bio.trim() !== (user.bio ?? '');

  return (
    <div className="space-y-6">
      <PageCard title="Settings">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5">
              {previewUrl ? (
                <img alt="" className="h-28 w-28 rounded-full object-cover" src={previewUrl} />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15 text-3xl font-semibold text-[var(--text)]/75">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="mt-4 text-sm font-medium text-[var(--text)]">{user.displayName}</p>
              <p className="mt-1 text-sm text-[var(--text)]/60">@{user.username}</p>
              <label className="mt-4 block cursor-pointer rounded-full border border-white/10 px-4 py-3 text-center text-sm font-medium text-[var(--text)]/85 transition hover:bg-white/12">
                Choose new profile image
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
              {selectedImage ? (
                <button
                  className="mt-3 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-60"
                  disabled={imageMutation.isPending}
                  onClick={() => imageMutation.mutate()}
                  type="button"
                >
                  {imageMutation.isPending ? 'Uploading...' : 'Save profile image'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setProfileMessage(null);
                if (canSaveProfile) {
                  profileMutation.mutate();
                }
              }}
            >
              <label className="space-y-2">
                <span className="block text-xs font-medium uppercase tracking-[0.16em] text-[var(--text)]/60">
                  Display Name
                </span>
                <input
                  className="w-full rounded-2xl border border-white/10 px-4 py-3"
                  onChange={(event) => setProfileFields((current) => ({ ...current, displayName: event.target.value }))}
                  value={profileFields.displayName}
                />
              </label>
              <label className="space-y-2">
                <span className="block text-xs font-medium uppercase tracking-[0.16em] text-[var(--text)]/60">
                  Username
                </span>
                <input
                  className="w-full rounded-2xl border border-white/10 px-4 py-3"
                  onChange={(event) => setProfileFields((current) => ({ ...current, username: event.target.value }))}
                  value={profileFields.username}
                />
              </label>
              <label className="space-y-2">
                <span className="block text-xs font-medium uppercase tracking-[0.16em] text-[var(--text)]/60">
                  Email
                </span>
                <input
                  className="w-full rounded-2xl border border-white/10 px-4 py-3"
                  onChange={(event) => setProfileFields((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                  value={profileFields.email}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="block text-xs font-medium uppercase tracking-[0.16em] text-[var(--text)]/60">
                  Bio
                </span>
                <textarea
                  className="h-32 w-full resize-none rounded-[1.5rem] border border-white/10 px-4 py-3"
                  maxLength={bioMaxLength}
                  onChange={(event) => setProfileFields((current) => ({ ...current, bio: event.target.value }))}
                  value={profileFields.bio}
                />
                <p className="text-right text-xs text-[var(--text)]/50">
                  {profileFields.bio.length}/{bioMaxLength}
                </p>
              </label>
              <div className="md:col-span-2">
                <button
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-60"
                  disabled={!canSaveProfile || profileMutation.isPending}
                  type="submit"
                >
                  {profileMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
            {profileMessage ? (
              <p className={`text-sm ${profileMessage.includes('saved') || profileMessage.includes('updated') ? 'text-[var(--accent)]' : 'text-[var(--accent)]'}`}>
                {profileMessage}
              </p>
            ) : null}
          </div>
        </div>
      </PageCard>

      {canApplyFamilyCode ? (
        <PageCard title="Join family">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setFamilyCodeMessage(null);

              if (!familyCode.trim()) {
                return;
              }

              if (window.confirm('Join this family? Your account will become a child account managed by this family.')) {
                familyCodeMutation.mutate();
              }
            }}
          >
            <input
              className="w-full rounded-2xl border border-white/10 px-4 py-3"
              onChange={(event) => setFamilyCode(event.target.value)}
              placeholder="Family code"
              value={familyCode}
            />
            <button
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-60"
              disabled={!familyCode.trim() || familyCodeMutation.isPending}
              type="submit"
            >
              {familyCodeMutation.isPending ? 'Joining...' : 'Apply code'}
            </button>
            {familyCodeMessage ? <p className="text-sm text-[var(--accent)]">{familyCodeMessage}</p> : null}
          </form>
        </PageCard>
      ) : null}

      <PageCard title="Password">
        <div className="space-y-4">
          <button
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text)]/85 transition hover:bg-white/12/5"
            onClick={() => {
              setPasswordMessage(null);
              setShowPasswordFields((current) => !current);
            }}
            type="button"
          >
            {showPasswordFields ? 'Hide password form' : 'Change password'}
          </button>
          {showPasswordFields ? (
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPasswordMessage(null);
                passwordMutation.mutate();
              }}
            >
              <input
                className="rounded-2xl border border-white/10 px-4 py-3"
                onChange={(event) =>
                  setPasswordFields((current) => ({ ...current, currentPassword: event.target.value }))
                }
                placeholder="Current password"
                type={showPasswordValues ? 'text' : 'password'}
                value={passwordFields.currentPassword}
              />
              <input
                className="rounded-2xl border border-white/10 px-4 py-3"
                onChange={(event) =>
                  setPasswordFields((current) => ({ ...current, newPassword: event.target.value }))
                }
                placeholder="New password"
                type={showPasswordValues ? 'text' : 'password'}
                value={passwordFields.newPassword}
              />
              <input
                className="rounded-2xl border border-white/10 px-4 py-3 md:col-span-2"
                onChange={(event) =>
                  setPasswordFields((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                placeholder="Confirm new password"
                type={showPasswordValues ? 'text' : 'password'}
                value={passwordFields.confirmPassword}
              />
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text)]/85 transition hover:bg-white/12/5"
                  onClick={() => setShowPasswordValues((current) => !current)}
                  type="button"
                >
                  {showPasswordValues ? 'Hide passwords' : 'Show passwords'}
                </button>
                <button
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-60"
                  disabled={
                    passwordMutation.isPending ||
                    !passwordFields.currentPassword ||
                    !passwordFields.newPassword ||
                    !passwordFields.confirmPassword
                  }
                  type="submit"
                >
                  {passwordMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : null}
          {passwordMessage ? (
            <p className={`text-sm ${passwordMessage === 'Password changed.' ? 'text-[var(--accent)]' : 'text-[var(--accent)]'}`}>
              {passwordMessage}
            </p>
          ) : null}
        </div>
      </PageCard>

      {user.role !== 'CHILD' ? (
        <PageCard title="Delete account">
          <div className="space-y-4">
            {user.hasChildren ? (
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-[var(--accent)]/35 px-5 py-3 text-sm font-medium text-[var(--accent)] disabled:opacity-60"
                  disabled={deleteAccountMutation.isPending}
                  onClick={() => handleDeleteAccount('DELETE_CHILDREN')}
                  type="button"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete children and account'}
                </button>
                <button
                  className="rounded-full border border-[var(--accent)]/35 px-5 py-3 text-sm font-medium text-[var(--accent)] disabled:opacity-60"
                  disabled={deleteAccountMutation.isPending}
                  onClick={() => handleDeleteAccount('RELEASE_CHILDREN')}
                  type="button"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Release children and delete account'}
                </button>
              </div>
            ) : (
              <button
                className="rounded-full border border-[var(--accent)]/35 px-5 py-3 text-sm font-medium text-[var(--accent)] disabled:opacity-60"
                disabled={deleteAccountMutation.isPending}
                onClick={() => handleDeleteAccount()}
                type="button"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete account'}
              </button>
            )}
            {deleteMessage ? <p className="text-sm text-[var(--accent)]">{deleteMessage}</p> : null}
          </div>
        </PageCard>
      ) : null}
    </div>
  );
};






