import { describe, expect, it } from 'vitest';
import { durationToDate, durationToMs } from '@/utils/duration';
import { CHILD_SETUP_PURPOSE } from './auth.constants';

describe('auth utilities', () => {
  it('parses duration strings used for session expiry and cookies', () => {
    expect(durationToMs('15m')).toBe(900000);
    expect(durationToDate('1d', new Date('2026-01-01T00:00:00.000Z')).toISOString()).toBe(
      '2026-01-02T00:00:00.000Z',
    );
  });

  it('issues child setup tokens with the expected purpose', async () => {
    process.env.DATABASE_URL = 'postgresql://local:test@localhost:5432/test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-123456';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-123456';

    const { signChildSetupToken, verifyChildSetupToken } = await import('./auth.tokens');
    const token = signChildSetupToken({
      sub: 'child-1',
      purpose: CHILD_SETUP_PURPOSE,
      accessCodeId: 'code-1',
    });

    expect(verifyChildSetupToken(token)).toMatchObject({
      sub: 'child-1',
      purpose: CHILD_SETUP_PURPOSE,
      accessCodeId: 'code-1',
    });
  });
});
