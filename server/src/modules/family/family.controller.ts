import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { familyService } from './family.service';

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

    const child = await familyService.getChild(req.auth.sub, req.params.childId);
    res.json({ child });
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

    await familyService.releaseChild(req.auth.sub, req.params.childId);
    res.status(204).send();
  },
  deleteChild: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await familyService.deleteChild(req.auth.sub, req.params.childId);
    res.status(204).send();
  },
};
