import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { authRequired } from '@/middleware/auth-required';
import { adminRequired } from '@/middleware/admin-required';
import { adminController } from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authRequired, adminRequired);

adminRouter.get('/summary', asyncHandler(adminController.getSummary));
adminRouter.get('/audit-logs', asyncHandler(adminController.listAuditLogs));
adminRouter.get('/reports', asyncHandler(adminController.listReports));
adminRouter.get('/users', asyncHandler(adminController.listUsers));
adminRouter.post('/users/:userId/disable', asyncHandler(adminController.disableUser));
adminRouter.post('/users/:userId/enable', asyncHandler(adminController.enableUser));
adminRouter.post('/users/:userId/promote-admin', asyncHandler(adminController.promoteUserToAdmin));
adminRouter.delete('/users/:userId', asyncHandler(adminController.deleteUser));
adminRouter.delete('/posts/:postId', asyncHandler(adminController.deletePost));


