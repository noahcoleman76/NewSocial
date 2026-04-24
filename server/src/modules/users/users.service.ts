import type { Express } from 'express';
import { AppError } from '@/lib/errors';
import { fileStorageService } from '@/modules/uploads/storage.service';
import { connectionService } from '@/modules/connections/connection.service';
import { connectionRepository } from '@/modules/connections/connection.repository';
import { normalizeConnectionPair } from '@/modules/connections/connection.rules';
import { toAuthUser } from '@/modules/auth/auth.mapper';
import { authService } from '@/modules/auth/auth.service';
import { usersRepository } from './users.repository';

export const usersService = {
  searchUsers: (requesterId: string, query: string) => connectionService.searchUsers(requesterId, query),
  updateMe: async (
    userId: string,
    input: {
      displayName?: string;
      username?: string;
      email?: string;
      bio?: string | null;
    },
  ) => {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    if (input.username) {
      const existingUsername = await usersRepository.findByUsername(input.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new AppError('USERNAME_TAKEN', 'Username is already in use', 409);
      }
    }

    if (input.email) {
      const existingEmail = await usersRepository.findByEmail(input.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new AppError('EMAIL_TAKEN', 'Email is already in use', 409);
      }
    }

    const updatedUser = await usersRepository.updateProfile(userId, {
      displayName: input.displayName?.trim(),
      username: input.username?.trim().toLowerCase(),
      email: input.email?.trim().toLowerCase(),
      bio: input.bio === undefined ? undefined : input.bio?.trim() || null,
    });

    return toAuthUser(updatedUser);
  },

  updateProfileImage: async (userId: string, file?: Express.Multer.File) => {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    if (!file) {
      throw new AppError('IMAGE_REQUIRED', 'A profile image is required', 422);
    }

    const profileImageUrl = await fileStorageService.saveImage(file, 'profiles');
    const updatedUser = await usersRepository.updateProfileImage(userId, profileImageUrl);
    return toAuthUser(updatedUser);
  },

  changePassword: async (
    userId: string,
    input: {
      currentPassword: string;
      newPassword: string;
    },
  ) => {
    const result = await authService.changePassword(userId, input);
    return result;
  },

  getProfile: async (viewerId: string, username: string) => {
    const target = await usersRepository.findByUsername(username);
    if (!target) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }

    const isSelf = target.id === viewerId;
    const [userAId, userBId] = normalizeConnectionPair(viewerId, target.id);
    const [connection, familyRelation, outgoingRequest, incomingRequest] = await Promise.all([
      isSelf ? Promise.resolve(null) : connectionRepository.findConnectionByUsers(userAId, userBId),
      isSelf ? Promise.resolve(null) : connectionRepository.findDirectFamilyRelation(viewerId, target.id),
      isSelf ? Promise.resolve(null) : connectionRepository.findRequestByUsers(viewerId, target.id),
      isSelf ? Promise.resolve(null) : connectionRepository.findRequestByUsers(target.id, viewerId),
    ]);

    let relationship: 'SELF' | 'NONE' | 'CONNECTED' | 'OUTGOING_REQUEST' | 'INCOMING_REQUEST' | 'PENDING_MANAGER_APPROVAL' =
      'NONE';

    if (isSelf) {
      relationship = 'SELF';
    } else if (familyRelation || connection?.status === 'ACTIVE') {
      relationship = 'CONNECTED';
    } else if (connection?.status === 'PENDING_MANAGER_APPROVAL') {
      relationship = 'PENDING_MANAGER_APPROVAL';
    } else if (outgoingRequest?.status === 'PENDING') {
      relationship = 'OUTGOING_REQUEST';
    } else if (incomingRequest?.status === 'PENDING') {
      relationship = 'INCOMING_REQUEST';
    }

    const canSeePosts = isSelf || relationship === 'CONNECTED';
    const posts = canSeePosts ? await usersRepository.findPostsByAuthorId(target.id, viewerId) : [];
    const mappedPosts = posts.map((post) => ({
      id: post.id,
      caption: post.caption,
      createdAt: post.createdAt,
      images: post.images.map((image) => image.imageUrl),
      imageCount: post.images.length,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      likedByMe: post.likes.length > 0,
      canDelete: target.id === viewerId,
    }));

    return {
      profile: {
        id: target.id,
        username: target.username,
        displayName: target.displayName,
        bio: target.bio,
        profileImageUrl: target.profileImageUrl,
        isFamilyLinked: target.role === 'CHILD' || Boolean(target.parentId),
        isFamilyConnection: Boolean(familyRelation),
        isSelf,
        relationship,
      },
      tabs: {
        feed: mappedPosts,
        pictures: mappedPosts.filter((post) => post.imageCount > 0),
        posts: mappedPosts.filter((post) => post.imageCount === 0),
      },
    };
  },
};
