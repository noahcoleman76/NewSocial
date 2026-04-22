import { describe, expect, it } from 'vitest';
import { buildConnectionRequestPlan } from './connection.service';

describe('buildConnectionRequestPlan', () => {
  it('auto-accepts when reverse pending request exists', () => {
    const outcome = buildConnectionRequestPlan({
      senderId: 'user-a',
      receiverId: 'user-b',
      reverseRequest: {
        id: 'req-1',
        senderId: 'user-b',
        receiverId: 'user-a',
        status: 'PENDING',
      },
    });

    expect(outcome.mode).toBe('AUTO_ACCEPT');
    expect(outcome.connection).toEqual({
      userAId: 'user-a',
      userBId: 'user-b',
    });
  });
});
