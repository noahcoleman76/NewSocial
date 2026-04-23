import type { ParentDeleteOutcome, UserRole } from '../../../../shared/types/domain';
import { AppError } from '@/lib/errors';

export type FamilyUser = {
  id: string;
  role: UserRole;
  parentId: string | null;
  accountStatus: 'ACTIVE' | 'DISABLED' | 'DELETED';
};

export const assertParentCanManageChild = (parentId: string, child: FamilyUser) => {
  if (child.role !== 'CHILD' || child.parentId !== parentId) {
    throw new AppError('FORBIDDEN', 'Parent relationship required', 403);
  }
};

export const resolveParentDeletionPlan = (
  children: FamilyUser[],
  outcome?: ParentDeleteOutcome,
) => {
  if (children.length > 0 && !outcome) {
    throw new AppError(
      'PARENT_DELETE_OUTCOME_REQUIRED',
      'Account deletion requires a child outcome selection',
      422,
    );
  }

  return children.map((child) =>
    outcome === 'RELEASE_CHILDREN'
      ? {
          childId: child.id,
          action: 'RELEASE' as const,
          nextRole: 'STANDARD' as const,
          nextParentId: null,
        }
      : {
          childId: child.id,
          action: 'DELETE' as const,
        },
  );
};

export const canEnableChildAccount = (child: FamilyUser, parent: FamilyUser | null) => {
  if (child.role !== 'CHILD') {
    return true;
  }

  return Boolean(parent && parent.id === child.parentId && parent.accountStatus === 'ACTIVE');
};
