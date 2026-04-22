import type { ParentDeleteOutcome } from '@shared/types/domain';
import { resolveParentDeletionPlan } from '@/modules/family/family.rules';

type DeleteUserOptions = {
  userId: string;
  role: 'STANDARD' | 'PARENT' | 'CHILD' | 'ADMIN';
  childIds: string[];
  outcome?: ParentDeleteOutcome;
};

export const buildUserDeletionPlan = ({ userId, role, childIds, outcome }: DeleteUserOptions) => {
  const children = childIds.map((id) => ({
    id,
    role: 'CHILD' as const,
    parentId: userId,
    accountStatus: 'ACTIVE' as const,
  }));

  const familyPlan = role === 'PARENT' ? resolveParentDeletionPlan(children, outcome) : [];

  return {
    deleteUserId: userId,
    familyPlan,
    preserveMessages: true,
    anonymizeIdentity: true,
    wipeProfileData: true,
    wipePosts: true,
    wipeConnections: true,
  };
};
