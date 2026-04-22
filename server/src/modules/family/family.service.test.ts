import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/errors';
import { familyService } from './family.service';

describe('familyService', () => {
  it('requires parent delete outcome when children exist', () => {
    expect(() =>
      familyService.resolveParentDeletionPlan([
        { id: 'child-1', role: 'CHILD', parentId: 'parent-1', accountStatus: 'ACTIVE' },
      ]),
    ).toThrow(AppError);
  });

  it('releases children into standard accounts when requested', () => {
    const plan = familyService.resolveParentDeletionPlan(
      [{ id: 'child-1', role: 'CHILD', parentId: 'parent-1', accountStatus: 'ACTIVE' }],
      'RELEASE_CHILDREN',
    );

    expect(plan[0]).toMatchObject({
      childId: 'child-1',
      action: 'RELEASE',
      nextRole: 'STANDARD',
      nextParentId: null,
    });
  });

  it('allows child enablement only with an active parent', () => {
    expect(
      familyService.canEnableChildAccount(
        { id: 'child-1', role: 'CHILD', parentId: 'parent-1', accountStatus: 'DISABLED' },
        { id: 'parent-1', role: 'PARENT', parentId: null, accountStatus: 'ACTIVE' },
      ),
    ).toBe(true);

    expect(
      familyService.canEnableChildAccount(
        { id: 'child-1', role: 'CHILD', parentId: 'parent-1', accountStatus: 'DISABLED' },
        { id: 'parent-1', role: 'PARENT', parentId: null, accountStatus: 'DISABLED' },
      ),
    ).toBe(false);
  });
});
