import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/app/auth-store';
import { PageCard } from '@/components/page-card';
import { api } from '@/lib/api';

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
      return user?.profileImageUrl ?? null;
    }

    return URL.createObjectURL(selectedImage);
  }, [selectedImage, user?.profileImageUrl]);

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

      if (profileFields.bio.trim()) {
        payload.bio = profileFields.bio.trim();
      }

      const { data } = await api.patch<UpdateUserResponse>('/users/me', payload);
      return data.user;
    },
    onSuccess: async (nextUser) => {
      setCurrentUser(nextUser);
      setProfileFields({ displayName: '', username: '', email: '', bio: '' });
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

  const canSaveProfile = Boolean(
    profileFields.displayName.trim() ||
      profileFields.username.trim() ||
      profileFields.email.trim() ||
      profileFields.bio.trim(),
  );
  const canApplyFamilyCode = user?.role === 'STANDARD' && !user.hasChildren;

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageCard title="Settings">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5">
              {previewUrl ? (
                <img alt="" className="h-28 w-28 rounded-full object-cover" src={previewUrl} />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15 text-3xl font-semibold text-[#F5F5F5]/75">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="mt-4 text-sm font-medium text-[#F5F5F5]">{user.displayName}</p>
              <p className="mt-1 text-sm text-[#F5F5F5]/60">@{user.username}</p>
              <label className="mt-4 block cursor-pointer rounded-full border border-white/10 px-4 py-3 text-center text-sm font-medium text-[#F5F5F5]/85 transition hover:bg-white/12">
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
                  className="mt-3 rounded-full bg-[#FF5A2F] px-4 py-2 text-sm font-medium text-[#0D0D0D] disabled:opacity-60"
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
              <input
                className="rounded-2xl border border-white/10 px-4 py-3"
                onChange={(event) => setProfileFields((current) => ({ ...current, displayName: event.target.value }))}
                placeholder={user.displayName}
                value={profileFields.displayName}
              />
              <input
                className="rounded-2xl border border-white/10 px-4 py-3"
                onChange={(event) => setProfileFields((current) => ({ ...current, username: event.target.value }))}
                placeholder={user.username}
                value={profileFields.username}
              />
              <input
                className="rounded-2xl border border-white/10 px-4 py-3"
                onChange={(event) => setProfileFields((current) => ({ ...current, email: event.target.value }))}
                placeholder={user.email}
                type="email"
                value={profileFields.email}
              />
              <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#F5F5F5]/60">
                {user.role === 'CHILD' ? 'Child account' : user.hasChildren ? 'Managing family' : 'Standard account'}
              </div>
              <textarea
                className="min-h-28 rounded-[1.5rem] border border-white/10 px-4 py-3 md:col-span-2"
                onChange={(event) => setProfileFields((current) => ({ ...current, bio: event.target.value }))}
                placeholder={user.bio ?? 'Add a short bio'}
                value={profileFields.bio}
              />
              <div className="md:col-span-2">
                <button
                  className="rounded-full bg-[#FF5A2F] px-5 py-3 text-sm font-medium text-[#0D0D0D] disabled:opacity-60"
                  disabled={!canSaveProfile || profileMutation.isPending}
                  type="submit"
                >
                  {profileMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
            {profileMessage ? (
              <p className={`text-sm ${profileMessage.includes('saved') || profileMessage.includes('updated') ? 'text-[#FF5A2F]' : 'text-[#FF5A2F]'}`}>
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
              className="rounded-full bg-[#FF5A2F] px-5 py-3 text-sm font-medium text-[#0D0D0D] disabled:opacity-60"
              disabled={!familyCode.trim() || familyCodeMutation.isPending}
              type="submit"
            >
              {familyCodeMutation.isPending ? 'Joining...' : 'Apply code'}
            </button>
            {familyCodeMessage ? <p className="text-sm text-[#FF5A2F]">{familyCodeMessage}</p> : null}
          </form>
        </PageCard>
      ) : null}

      <PageCard title="Password">
        <div className="space-y-4">
          <button
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[#F5F5F5]/85 transition hover:bg-white/12/5"
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
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[#F5F5F5]/85 transition hover:bg-white/12/5"
                  onClick={() => setShowPasswordValues((current) => !current)}
                  type="button"
                >
                  {showPasswordValues ? 'Hide passwords' : 'Show passwords'}
                </button>
                <button
                  className="rounded-full bg-[#FF5A2F] px-5 py-3 text-sm font-medium text-[#0D0D0D] disabled:opacity-60"
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
            <p className={`text-sm ${passwordMessage === 'Password changed.' ? 'text-[#FF5A2F]' : 'text-[#FF5A2F]'}`}>
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
                  className="rounded-full border border-[#FF5A2F]/35 px-5 py-3 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
                  disabled={deleteAccountMutation.isPending}
                  onClick={() => handleDeleteAccount('DELETE_CHILDREN')}
                  type="button"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete children and account'}
                </button>
                <button
                  className="rounded-full border border-[#FF5A2F]/35 px-5 py-3 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
                  disabled={deleteAccountMutation.isPending}
                  onClick={() => handleDeleteAccount('RELEASE_CHILDREN')}
                  type="button"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Release children and delete account'}
                </button>
              </div>
            ) : (
              <button
                className="rounded-full border border-[#FF5A2F]/35 px-5 py-3 text-sm font-medium text-[#FF5A2F] disabled:opacity-60"
                disabled={deleteAccountMutation.isPending}
                onClick={() => handleDeleteAccount()}
                type="button"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete account'}
              </button>
            )}
            {deleteMessage ? <p className="text-sm text-[#FF5A2F]">{deleteMessage}</p> : null}
          </div>
        </PageCard>
      ) : null}
    </div>
  );
};











