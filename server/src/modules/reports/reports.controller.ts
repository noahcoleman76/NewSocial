import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { reportsService } from './reports.service';

export const reportsController = {
  create: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const report = await reportsService.createReport({
      reporterId: req.auth.sub,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      reason: req.body.reason,
      message: req.body.message,
    });

    res.status(201).json({ reportId: report.id });
  },
};
