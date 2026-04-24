import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { validate } from '@/lib/validate';
import { authRequired } from '@/middleware/auth-required';
import { reportsController } from './reports.controller';
import { createReportSchema } from './report.schemas';

export const reportsRouter = Router();

reportsRouter.post('/', authRequired, validate(createReportSchema), asyncHandler(reportsController.create));
