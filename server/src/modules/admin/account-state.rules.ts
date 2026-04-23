import type { UserRole } from '../../../../shared/types/domain';
import { AppError } from '@/lib/errors';

export type AccountStateUser = {
  id: string;
  role: UserRole;
  accountStatus: 'ACTIVE' | 'DISABLED' | 'DELETED';
  parentId: string | null;
};

export const resolveDisableCascade = (user: AccountStateUser, children: AccountStateUser[]) => {
  if (user.role !== 'STANDARD') {
    return [user.id];
  }

  return [user.id, ...children.map((child) => child.id)];
};

export const assertActiveAccount = (user: AccountStateUser, parent?: AccountStateUser | null) => {
  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError('ACCOUNT_DISABLED', 'Account is disabled', 403);
  }

  if (user.role === 'CHILD' && (!parent || parent.accountStatus !== 'ACTIVE')) {
    throw new AppError('FAMILY_MANAGER_ACCOUNT_DISABLED', 'Child account requires an active managing account', 403);
  }
};
