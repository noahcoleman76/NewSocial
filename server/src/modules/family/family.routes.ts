import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { familyController } from './family.controller';

export const familyRouter = Router();

familyRouter.get('/children', asyncHandler(familyController.listChildren));
