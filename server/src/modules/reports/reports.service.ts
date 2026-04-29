import { AppError } from '@/lib/errors';
import { postsRepository } from '@/modules/posts/posts.repository';
import { reportsRepository } from './reports.repository';

export const reportsService = {
  createReport: async (data: {
    reporterId: string;
    targetType: 'POST' | 'ACCOUNT';
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

    if (data.targetType === 'ACCOUNT') {
      const account = await reportsRepository.findAccountById(data.targetId);
      if (!account) {
        throw new AppError('ACCOUNT_NOT_FOUND', 'Account not found', 404);
      }
    }

    return reportsRepository.create(data);
  },

  listOpenReports: async () => {
    const reports = await reportsRepository.listOpenReports();

    return Promise.all(
      reports.map(async (report) => {
        const targetAccount = report.targetType === 'ACCOUNT' ? await reportsRepository.findAccountById(report.targetId) : null;
        const targetPost = report.targetType === 'POST' ? await postsRepository.findPostById(report.targetId, report.reporterId) : null;

        return {
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
          targetAccount,
          targetPost: targetPost
            ? {
                id: targetPost.id,
                caption: targetPost.caption,
                author: {
                  id: targetPost.author.id,
                  username: targetPost.author.username,
                  displayName: targetPost.author.displayName,
                },
              }
            : null,
        };
      }),
    );
  },
};
