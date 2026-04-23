import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/errors';
import { accountStateService } from './account-state.service';

describe('accountStateService', () => {
  it('cascades parent disablement to children', () => {
    const affected = accountStateService.resolveDisableCascade(
      { id: 'parent-1', role: 'STANDARD', accountStatus: 'ACTIVE', parentId: null },
      [{ id: 'child-1', role: 'CHILD', accountStatus: 'ACTIVE', parentId: 'parent-1' }],
    );

    expect(affected).toEqual(['parent-1', 'child-1']);
  });

  it('blocks active checks when a child parent is disabled', () => {
    expect(() =>
      accountStateService.assertActiveAccount(
        { id: 'child-1', role: 'CHILD', accountStatus: 'ACTIVE', parentId: 'parent-1' },
        { id: 'parent-1', role: 'STANDARD', accountStatus: 'DISABLED', parentId: null },
      ),
    ).toThrow(AppError);
  });
});
