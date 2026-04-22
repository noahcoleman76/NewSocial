import type { Request, Response } from 'express';
import { familyRepository } from './family.repository';

export const familyController = {
  listChildren: async (_req: Request, res: Response) => {
    const children = await familyRepository.listChildren();
    res.json({ children });
  },
};
