import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { adminController } from './admin.controller';

export const adminRouter = Router();

adminRouter.get('/audit-logs', asyncHandler(adminController.listAuditLogs));
