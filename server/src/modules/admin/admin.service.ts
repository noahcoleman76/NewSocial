import { AppError } from '@/lib/errors';
import { reportsService } from '@/modules/reports/reports.service';
import { postsRepository } from '@/modules/posts/posts.repository';
import { adminRepository } from './admin.repository';

export const adminService = {
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
  deleteReportedPost: async (adminUserId: string, postId: string) => {
    const post = await postsRepository.findPostById(postId, adminUserId);
    if (!post) {
      throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
    }

    await adminRepository.deletePost(postId);
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
