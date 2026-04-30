import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { familyService } from './family.service';

const getChildId = (req: Request) => {
  const { childId } = req.params;

  return Array.isArray(childId) ? childId[0] : childId;
};

const getConnectionId = (req: Request) => {
  const { connectionId } = req.params;

  return Array.isArray(connectionId) ? connectionId[0] : connectionId;
};

export const familyController = {
  listChildren: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const children = await familyService.listChildren(req.auth.sub);
    res.json({ children });
  },
  getChild: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const child = await familyService.getChild(req.auth.sub, getChildId(req));
    res.json({ child });
  },
  listChildMessages: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const data = await familyService.listChildMessages(req.auth.sub, getChildId(req));
    res.json(data);
  },
  listChildConnections: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const data = await familyService.listChildConnections(req.auth.sub, getChildId(req));
    res.json(data);
  },
  approvePendingConnection: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await familyService.approvePendingConnection(req.auth.sub, getChildId(req), getConnectionId(req));
    res.status(204).send();
  },
  rejectPendingConnection: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await familyService.rejectPendingConnection(req.auth.sub, getChildId(req), getConnectionId(req));
    res.status(204).send();
  },
  removeChildConnection: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await familyService.removeChildConnection(req.auth.sub, getChildId(req), getConnectionId(req));
    res.status(204).send();
  },

  getCode: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const code = await familyService.getFamilyCode(req.auth.sub);
    res.json({ code });
  },
  releaseChild: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await familyService.releaseChild(req.auth.sub, getChildId(req));
    res.status(204).send();
  },
  deleteChild: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await familyService.deleteChild(req.auth.sub, getChildId(req));
    res.status(204).send();
  },
};
