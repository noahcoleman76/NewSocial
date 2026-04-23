type AuthUserLike = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  role: string;
  accountStatus: string;
  profileImageUrl: string | null;
  parentId: string | null;
  createdAt: Date;
  children?: { id: string }[];
};

export const toAuthUser = (user: AuthUserLike) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  bio: user.bio,
  role: user.role,
  accountStatus: user.accountStatus,
  profileImageUrl: user.profileImageUrl,
  parentId: user.parentId,
  hasChildren: Boolean(user.children?.length),
  createdAt: user.createdAt,
});
