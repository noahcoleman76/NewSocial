import { AppError } from '@/lib/errors';
import { reportsService } from '@/modules/reports/reports.service';
import { postsRepository } from '@/modules/posts/posts.repository';
import { adminRepository } from './admin.repository';

const mapModerationUser = (user: Awaited<ReturnType<typeof adminRepository.findUserForModeration>> extends infer T ? NonNullable<T> : never) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  role: user.role,
  accountStatus: user.accountStatus,
  parentId: user.parentId,
  createdAt: user.createdAt,
  parent: user.parent,
  children: user.children,
  childCount: user.children.length,
});

const assertNotSelf = (adminUserId: string, targetUserId: string, action: string) => {
  if (adminUserId === targetUserId) {
    throw new AppError('ADMIN_SELF_ACTION_FORBIDDEN', `Admins cannot ${action} their own account`, 403);
  }
};

const loadModerationUser = async (userId: string) => {
  const user = await adminRepository.findUserForModeration(userId);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  return user;
};

export const adminService = {
  getSummary: async () => ({
    activeAccountCount: await adminRepository.countActiveAccounts(),
  }),

  listUsers: async () => {
    const users = await adminRepository.listUsers();
    return users.map(mapModerationUser);
  },

  disableUser: async (adminUserId: string, targetUserId: string) => {
    assertNotSelf(adminUserId, targetUserId, 'disable');
    const user = await loadModerationUser(targetUserId);

    await adminRepository.setAccountStatus([targetUserId], 'DISABLED');
    await adminRepository.createAuditLog({
      adminUserId,
      actionType: 'DISABLE_ACCOUNT',
      targetType: 'ACCOUNT',
      targetId: targetUserId,
      metadata: {
        role: user.role,
        childCount: user.children.length,
      },
    });
  },

  enableUser: async (adminUserId: string, targetUserId: string) => {
    assertNotSelf(adminUserId, targetUserId, 'enable');
    const user = await loadModerationUser(targetUserId);

    if (user.role === 'CHILD' && (!user.parent || user.parent.accountStatus !== 'ACTIVE')) {
      throw new AppError('CHILD_ENABLE_REQUIRES_ACTIVE_MANAGER', 'Child accounts can only be enabled with an active manager', 422);
    }

    await adminRepository.setAccountStatus([targetUserId], 'ACTIVE');
    await adminRepository.createAuditLog({
      adminUserId,
      actionType: 'ENABLE_ACCOUNT',
      targetType: 'ACCOUNT',
      targetId: targetUserId,
      metadata: {
        role: user.role,
        parentId: user.parentId,
      },
    });
  },

  deleteUser: async (adminUserId: string, targetUserId: string) => {
    assertNotSelf(adminUserId, targetUserId, 'delete');
    const user = await loadModerationUser(targetUserId);
    const targetIds = [user.id, ...user.children.map((child) => child.id)];

    await adminRepository.deleteUsersCompletely(targetIds);
    await adminRepository.createAuditLog({
      adminUserId,
      actionType: 'DELETE_ACCOUNT',
      targetType: 'ACCOUNT',
      targetId: targetUserId,
      metadata: {
        deletedUserIds: targetIds,
        role: user.role,
      },
    });
  },

  promoteUserToAdmin: async (adminUserId: string, targetUserId: string) => {
    assertNotSelf(adminUserId, targetUserId, 'promote');
    const user = await loadModerationUser(targetUserId);

    if (user.accountStatus !== 'ACTIVE') {
      throw new AppError('ADMIN_PROMOTION_ACCOUNT_INACTIVE', 'Only active accounts can be promoted to admin', 422);
    }

    if (user.role !== 'STANDARD' || user.parentId || user.children.length > 0) {
      throw new AppError(
        'ADMIN_PROMOTION_NOT_ALLOWED',
        'Only standard accounts without child accounts can be promoted to admin',
        422,
      );
    }

    await adminRepository.promoteUserToAdmin(targetUserId);
    await adminRepository.createAuditLog({
      adminUserId,
      actionType: 'PROMOTE_TO_ADMIN',
      targetType: 'ACCOUNT',
      targetId: targetUserId,
      metadata: {
        previousRole: user.role,
        username: user.username,
      },
    });
  },

  listAuditLogs: async () => {
    const items = await adminRepository.listAuditLogs();

    return items.map((item) => ({
      id: item.id,
      actionType: item.actionType,
      targetType: item.targetType,
      targetId: item.targetId,
      createdAt: item.createdAt,
      adminUser: item.adminUser,
      metadata: item.metadata,
    }));
  },

  listOpenReports: reportsService.listOpenReports,
  dismissReport: async (adminUserId: string, reportId: string) => {
    const result = await adminRepository.dismissReport(reportId, adminUserId);
    if (result.count === 0) {
      throw new AppError('REPORT_NOT_FOUND', 'Open report not found', 404);
    }

    await adminRepository.createAuditLog({
      adminUserId,
      actionType: 'DISMISS_REPORT',
      targetType: 'REPORT',
      targetId: reportId,
      metadata: {},
    });
  },
  deleteReportedPost: async (adminUserId: string, postId: string) => {
    const post = await postsRepository.findPostById(postId, adminUserId);
    if (!post) {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await adminRepository.deletePost(postId);
    await adminRepository.resolveOpenPostReports(postId, adminUserId);
    await adminRepository.createAuditLog({
      adminUserId,
      actionType: 'DELETE_POST',
      targetType: 'POST',
      targetId: postId,
      metadata: {
        authorId: post.author.id,
      },
    });
  },
};







