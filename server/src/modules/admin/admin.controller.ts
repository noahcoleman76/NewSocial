import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { adminService } from './admin.service';

const getUserId = (req: Request) => {
  const { userId } = req.params;
  return Array.isArray(userId) ? userId[0] : userId;
};

export const adminController = {
  getSummary: async (_req: Request, res: Response) => {
    const summary = await adminService.getSummary();
    res.json(summary);
  },

  listUsers: async (_req: Request, res: Response) => {
    const users = await adminService.listUsers();
    res.json({ users });
  },

  disableUser: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await adminService.disableUser(req.auth.sub, getUserId(req));
    res.status(204).send();
  },

  enableUser: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await adminService.enableUser(req.auth.sub, getUserId(req));
    res.status(204).send();
  },

  deleteUser: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await adminService.deleteUser(req.auth.sub, getUserId(req));
    res.status(204).send();
  },

  promoteUserToAdmin: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await adminService.promoteUserToAdmin(req.auth.sub, getUserId(req));
    res.status(204).send();
  },

  listAuditLogs: async (_req: Request, res: Response) => {
    const items = await adminService.listAuditLogs();
    res.json({ items });
  },

  listReports: async (_req: Request, res: Response) => {
    const reports = await adminService.listOpenReports();
    res.json({ reports });
  },

  dismissReport: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    await adminService.dismissReport(req.auth.sub, reportId);
    res.status(204).send();
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




