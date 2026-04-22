import { assertParentCanManageChild, canEnableChildAccount, resolveParentDeletionPlan } from './family.rules';

export const familyService = {
  assertParentCanManageChild,
  canEnableChildAccount,
  resolveParentDeletionPlan,
};
