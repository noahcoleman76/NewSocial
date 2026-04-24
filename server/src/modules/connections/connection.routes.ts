import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { validate } from '@/lib/validate';
import { authRequired } from '@/middleware/auth-required';
import { connectionController } from './connection.controller';
import { connectionRequestParamsSchema, connectionUserParamsSchema, createConnectionRequestSchema } from './connection.schemas';

export const connectionRouter = Router();

connectionRouter.get('/', authRequired, asyncHandler(connectionController.listConnections));
connectionRouter.post(
  '/requests',
  authRequired,
  validate(createConnectionRequestSchema),
  asyncHandler(connectionController.createRequest),
);
connectionRouter.post(
  '/requests/:requestId/accept',
  authRequired,
  validate(connectionRequestParamsSchema, 'params'),
  asyncHandler(connectionController.acceptRequest),
);
connectionRouter.post(
  '/requests/:requestId/cancel',
  authRequired,
  validate(connectionRequestParamsSchema, 'params'),
  asyncHandler(connectionController.cancelRequest),
);
connectionRouter.delete(
  '/:userId',
  authRequired,
  validate(connectionUserParamsSchema, 'params'),
  asyncHandler(connectionController.removeConnection),
);
