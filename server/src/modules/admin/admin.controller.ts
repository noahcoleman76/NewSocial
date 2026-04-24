import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { adminService } from './admin.service';

export const adminController = {
  listAuditLogs: async (_req: Request, res: Response) => {
    const items = await adminService.listAuditLogs();
    res.json({ items });
  },
  listReports: async (_req: Request, res: Response) => {
    const reports = await adminService.listOpenReports();
    res.json({ reports });
  },
  deletePost: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
    await adminService.deleteReportedPost(req.auth.sub, postId);
    res.status(204).send();
  },
};
