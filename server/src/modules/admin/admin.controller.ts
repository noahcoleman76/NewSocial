import type { Request, Response } from 'express';
import { adminService } from './admin.service';

export const adminController = {
  listAuditLogs: async (_req: Request, res: Response) => {
    const items = await adminService.listAuditLogs();
    res.json({ items });
  },
};
