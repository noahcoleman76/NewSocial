import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { authRequired } from '@/middleware/auth-required';
import { familyController } from './family.controller';

export const familyRouter = Router();

familyRouter.get('/children', authRequired, asyncHandler(familyController.listChildren));
familyRouter.get('/code', authRequired, asyncHandler(familyController.getCode));
familyRouter.get('/children/:childId', authRequired, asyncHandler(familyController.getChild));
familyRouter.post('/children/:childId/release', authRequired, asyncHandler(familyController.releaseChild));
familyRouter.delete('/children/:childId', authRequired, asyncHandler(familyController.deleteChild));
