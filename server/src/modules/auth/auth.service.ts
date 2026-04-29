import bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '@/config/env';
import { AppError } from '@/lib/errors';
import { durationToDate } from '@/utils/duration';
import { accountStateService } from '@/modules/admin/account-state.service';
import { CHILD_SETUP_PURPOSE } from './auth.constants';
import { toAuthUser } from './auth.mapper';
import { authRepository } from './auth.repository';
import {
  signAccessToken,
  signChildSetupToken,
  signRefreshToken,
  verifyChildSetupToken,
  verifyRefreshToken,
} from './auth.tokens';

const hashOpaqueToken = (token: string) => createHash('sha256').update(token).digest('hex');

const constantTimeEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const assertLoginAllowed = (user: NonNullable<Awaited<ReturnType<typeof authRepository.findUserByEmail>>>) => {
  accountStateService.assertActiveAccount(user, user.parent);
};

const createSessionTokens = async (user: NonNullable<Awaited<ReturnType<typeof authRepository.findUserByEmail>>>) => {
  const sessionId = randomUUID();
  const refreshToken = signRefreshToken({
    sub: user.id,
    role: user.role,
    sessionId,
  });

  await authRepository.createSession({
    id: sessionId,
    userId: user.id,
    refreshTokenHash: hashOpaqueToken(refreshToken),
    expiresAt: durationToDate(env.JWT_REFRESH_TTL),
  });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    sessionId,
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const authService = {
  register: async (input: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    familyCode?: string;
  }) => {
    const existingEmail = await authRepository.findUserByEmail(input.email);
    if (existingEmail) {
      throw new AppError('EMAIL_TAKEN', 'Email is already in use', 409);
    }

    const existingUsername = await authRepository.findUserByUsername(input.username);
    if (existingUsername) {
      throw new AppError('USERNAME_TAKEN', 'Username is already in use', 409);
    }

    const normalizedFamilyCode = input.familyCode?.trim();
    const passwordHash = await bcrypt.hash(input.password, 10);
    let role: 'STANDARD' | 'CHILD' = 'STANDARD';
    let parentId: string | null = null;

    if (normalizedFamilyCode) {
      const matchedCode = await authRepository.findUserByFamilyCode(normalizedFamilyCode);
      if (!matchedCode) {
        throw new AppError('INVALID_FAMILY_CODE', 'Family code is invalid or expired', 401);
      }

      accountStateService.assertActiveAccount(matchedCode, matchedCode.parent);
      role = 'CHILD';
      parentId = matchedCode.id;
    }

    const user = await authRepository.createUser({
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash,
      role,
      parentId,
    });

    const hydratedUser = await authRepository.findUserById(user.id);
    if (!hydratedUser) {
      throw new AppError('USER_NOT_FOUND', 'Created user could not be loaded', 500);
    }

    const session = await createSessionTokens(hydratedUser);
    return {
      ...session,
      user: toAuthUser(hydratedUser),
    };
  },

  login: async (input: { identifier: string; password: string }) => {
    const identifier = input.identifier.trim().toLowerCase();
    const user = identifier.includes('@')
      ? await authRepository.findUserByEmail(identifier)
      : await authRepository.findUserByUsername(identifier);

    if (!user || !user.passwordHash) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email, username, or password', 401);
    }

    assertLoginAllowed(user);

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email, username, or password', 401);
    }

    const session = await createSessionTokens(user);
    return {
      ...session,
      user: toAuthUser(user),
    };
  },

  childFirstLogin: async (input: { email: string; code: string }) => {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || user.role !== 'CHILD') {
      throw new AppError('INVALID_CHILD_ACCESS', 'Invalid child access credentials', 401);
    }

    assertLoginAllowed(user);

    const accessCode = await authRepository.findLatestChildAccessCode(user.id);
    if (!accessCode) {
      throw new AppError('CHILD_ACCESS_CODE_NOT_FOUND', 'No child access code is available', 404);
    }

    if (accessCode.usedAt) {
      throw new AppError('CHILD_ACCESS_CODE_USED', 'This child access code has already been used', 409);
    }

    if (accessCode.expiresAt.getTime() < Date.now()) {
      throw new AppError('CHILD_ACCESS_CODE_EXPIRED', 'This child access code has expired', 410);
    }

    const codeMatches = await bcrypt.compare(input.code, accessCode.codeHash);
    if (!codeMatches) {
      throw new AppError('INVALID_CHILD_ACCESS', 'Invalid child access credentials', 401);
    }

    const childToken = signChildSetupToken({
      sub: user.id,
      purpose: CHILD_SETUP_PURPOSE,
      accessCodeId: accessCode.id,
    });

    await authRepository.markChildAccessCodeUsed(accessCode.id);

    return {
      childToken,
      childUserId: user.id,
      email: user.email,
    };
  },

  childSetPassword: async (input: { childToken: string; password: string }) => {
    let payload;
    try {
      payload = verifyChildSetupToken(input.childToken);
    } catch {
      throw new AppError('INVALID_CHILD_TOKEN', 'Child setup token is invalid or expired', 401);
    }

    if (payload.purpose !== CHILD_SETUP_PURPOSE) {
      throw new AppError('INVALID_CHILD_TOKEN', 'Child setup token is invalid', 401);
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || user.role !== 'CHILD') {
      throw new AppError('USER_NOT_FOUND', 'Child account not found', 404);
    }

    assertLoginAllowed(user);

    const accessCode = await authRepository.findChildAccessCodeById(payload.accessCodeId);
    if (!accessCode) {
      throw new AppError('CHILD_ACCESS_CODE_NOT_FOUND', 'No child access code is available', 404);
    }

    if (accessCode.childUserId !== user.id) {
      throw new AppError('INVALID_CHILD_TOKEN', 'Child setup token does not match the access code', 401);
    }

    if (!accessCode.usedAt) {
      throw new AppError('CHILD_ACCESS_CODE_NOT_USED', 'Child access code must be consumed before password setup', 409);
    }

    if (accessCode.expiresAt.getTime() < Date.now()) {
      throw new AppError('CHILD_ACCESS_CODE_EXPIRED', 'This child access code has expired', 410);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const updatedUser = await authRepository.setChildPassword(user.id, passwordHash);

    const session = await createSessionTokens(updatedUser);
    return {
      ...session,
      user: toAuthUser(updatedUser),
    };
  },

  refresh: async (refreshToken: string) => {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('UNAUTHORIZED', 'Refresh token is invalid or expired', 401);
    }

    const session = await authRepository.findSessionById(payload.sessionId);
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new AppError('UNAUTHORIZED', 'Refresh session is no longer valid', 401);
    }

    assertLoginAllowed(session.user);

    const incomingHash = hashOpaqueToken(refreshToken);
    if (!constantTimeEquals(incomingHash, session.refreshTokenHash)) {
      throw new AppError('UNAUTHORIZED', 'Refresh token does not match session', 401);
    }

    await authRepository.revokeSession(session.id);
    const nextSession = await createSessionTokens(session.user);

    return {
      ...nextSession,
      user: toAuthUser(session.user),
    };
  },

  logout: async (refreshToken?: string) => {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      await authRepository.revokeSession(payload.sessionId);
    } catch {
      return;
    }
  },

  changePassword: async (userId: string, input: { currentPassword: string; newPassword: string }) => {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.passwordHash) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    assertLoginAllowed(user);

    const currentMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!currentMatches) {
      throw new AppError('INVALID_CREDENTIALS', 'Current password is incorrect', 401);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    const updatedUser = await authRepository.updatePassword(user.id, passwordHash);
    await authRepository.revokeUserSessions(user.id);
    const session = await createSessionTokens(updatedUser);

    return {
      ...session,
      user: toAuthUser(updatedUser),
    };
  },

  getCurrentUser: async (userId: string) => {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    assertLoginAllowed(user);
    return toAuthUser(user);
  },
};

