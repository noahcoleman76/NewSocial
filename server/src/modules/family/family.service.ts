import { randomBytes } from 'node:crypto';
import { AppError } from '@/lib/errors';
import { authRepository } from '@/modules/auth/auth.repository';
import { assertParentCanManageChild, canEnableChildAccount, resolveParentDeletionPlan } from './family.rules';
import { familyRepository } from './family.repository';

export const familyService = {
  assertParentCanManageChild,
  canEnableChildAccount,
  resolveParentDeletionPlan,
  listChildren: async (managerUserId: string) => familyRepository.listChildren(managerUserId),
  getChild: async (managerUserId: string, childId: string) => {
    const child = await familyRepository.findChildById(managerUserId, childId);
    if (!child) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }

    return child;
  },
  getFamilyCode: async (managerUserId: string) => {
    const manager = await authRepository.findUserById(managerUserId);
    if (!manager) {
      throw new AppError('USER_NOT_FOUND', 'Managing account not found', 404);
    }

    if (manager.role !== 'STANDARD') {
      throw new AppError('FORBIDDEN', 'Only standard accounts can manage family codes', 403);
    }

    const existingCode = await familyRepository.getFamilyCode(managerUserId);
    if (existingCode) {
      return { value: existingCode };
    }

    const code = randomBytes(5).toString('hex').toUpperCase();
    const updatedManager = await authRepository.updateFamilyCode(managerUserId, code);

    return {
      value: updatedManager.familyCode ?? code,
    };
  },
  releaseChild: async (managerUserId: string, childId: string) => {
    const result = await familyRepository.releaseChild(managerUserId, childId);
    if (result.count === 0) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }
  },
  deleteChild: async (managerUserId: string, childId: string) => {
    const result = await familyRepository.deleteChild(managerUserId, childId);
    if (result.count === 0) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }
  },
};
