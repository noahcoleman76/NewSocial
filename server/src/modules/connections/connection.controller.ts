import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { connectionService } from './connection.service';

const getRequestId = (req: Request) => {
  const { requestId } = req.params;

  return Array.isArray(requestId) ? requestId[0] : requestId;
};

export const connectionController = {
  listConnections: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const data = await connectionService.listConnections(req.auth.sub);
    res.json(data);
  },

  createRequest: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const result = await connectionService.createRequest(req.auth.sub, req.body.receiverId);
    res.status(201).json(result);
  },

  acceptRequest: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const result = await connectionService.acceptRequest(req.auth.sub, getRequestId(req));
    res.json(result);
  },

  cancelRequest: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await connectionService.cancelRequest(req.auth.sub, getRequestId(req));
    res.status(204).send();
  },
};
