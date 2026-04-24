import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { adminRequired } from '@/middleware/admin-required';
import { adminController } from './admin.controller';

export const adminRouter = Router();

adminRouter.get('/audit-logs', adminRequired, asyncHandler(adminController.listAuditLogs));
adminRouter.get('/reports', adminRequired, asyncHandler(adminController.listReports));
adminRouter.delete('/posts/:postId', adminRequired, asyncHandler(adminController.deletePost));
