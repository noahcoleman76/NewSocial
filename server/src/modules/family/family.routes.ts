import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { authRequired } from '@/middleware/auth-required';
import { familyController } from './family.controller';

export const familyRouter = Router();

familyRouter.get('/children', authRequired, asyncHandler(familyController.listChildren));
familyRouter.get('/code', authRequired, asyncHandler(familyController.getCode));
familyRouter.get('/children/:childId', authRequired, asyncHandler(familyController.getChild));
familyRouter.get('/children/:childId/messages', authRequired, asyncHandler(familyController.listChildMessages));
familyRouter.get('/children/:childId/connections', authRequired, asyncHandler(familyController.listChildConnections));
familyRouter.post(
  '/children/:childId/connections/:connectionId/approve',
  authRequired,
  asyncHandler(familyController.approvePendingConnection),
);
familyRouter.post(
  '/children/:childId/connections/:connectionId/reject',
  authRequired,
  asyncHandler(familyController.rejectPendingConnection),
);
familyRouter.post('/children/:childId/release', authRequired, asyncHandler(familyController.releaseChild));
familyRouter.delete('/children/:childId', authRequired, asyncHandler(familyController.deleteChild));
