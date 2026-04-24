import { AppError } from '@/lib/errors';
import { postsRepository } from '@/modules/posts/posts.repository';
import { reportsRepository } from './reports.repository';

export const reportsService = {
  createReport: async (data: {
    reporterId: string;
    targetType: 'POST' | 'ACCOUNT' | 'MESSAGE';
    targetId: string;
    reason: string;
    message?: string;
  }) => {
    if (data.targetType === 'POST') {
      const post = await postsRepository.findPostById(data.targetId, data.reporterId);
      if (!post) {
        throw new AppError('POST_NOT_FOUND', 'Post not found', 404);
      }
    }

    return reportsRepository.create(data);
  },

  listOpenReports: async () => {
    const reports = await reportsRepository.listOpenReports();

    return reports.map((report) => ({
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      message: report.message,
      createdAt: report.createdAt,
      reporter: {
        id: report.reporter.id,
        username: report.reporter.username,
        displayName: report.reporter.displayName,
      },
    }));
  },
};
