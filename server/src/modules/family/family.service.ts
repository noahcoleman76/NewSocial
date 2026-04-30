import { randomBytes } from 'node:crypto';
import { AppError } from '@/lib/errors';
import { authRepository } from '@/modules/auth/auth.repository';
import { assertParentCanManageChild, canEnableChildAccount, resolveParentDeletionPlan } from './family.rules';
import { familyRepository } from './family.repository';

const mapConnectionUser = (user: {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  role: 'STANDARD' | 'CHILD' | 'ADMIN';
  parentId?: string | null;
}) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  profileImageUrl: user.profileImageUrl,
  role: user.role,
  isFamilyLinked: user.role === 'CHILD' || Boolean(user.parentId),
});

export const familyService = {
  assertParentCanManageChild,
  canEnableChildAccount,
  resolveParentDeletionPlan,
  listChildren: async (managerUserId: string) => {
    const children = await familyRepository.listChildren(managerUserId);

    return Promise.all(
      children.map(async (child) => ({
        ...child,
        pendingApprovalCount: await familyRepository.countPendingApprovalsForChild(managerUserId, child.id),
      })),
    );
  },
  getChild: async (managerUserId: string, childId: string) => {
    const child = await familyRepository.findChildById(managerUserId, childId);
    if (!child) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }

    return child;
  },
  listChildMessages: async (managerUserId: string, childId: string) => {
    const child = await familyRepository.findChildById(managerUserId, childId);
    if (!child) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }

    const conversations = await familyRepository.listChildConversations(managerUserId, childId);

    return {
      child,
      conversations: conversations.map((conversation) => {
        const childParticipant = conversation.participants.find((participant) => participant.userId === childId);
        const participant = conversation.participants.find((entry) => entry.userId !== childId)?.user ?? null;
        const newestMessage = conversation.messages[0] ?? null;
        const unread =
          Boolean(newestMessage) &&
          newestMessage.senderId !== childId &&
          (!childParticipant?.lastOpenedAt || newestMessage.createdAt > childParticipant.lastOpenedAt);

        return {
          id: conversation.id,
          participant: participant
            ? {
                id: participant.id,
                username: participant.username,
                displayName: participant.displayName,
                profileImageUrl: participant.profileImageUrl,
                role: participant.role,
                isFamilyLinked: participant.role === 'CHILD',
                deleted: participant.accountStatus === 'DELETED',
              }
            : null,
          unread,
          messages: [...conversation.messages]
            .reverse()
            .map((message) => ({
              id: message.id,
              body: message.body,
              createdAt: message.createdAt,
              author: {
                id: message.senderId,
                name:
                  message.deletedSenderLabel || message.senderId === null
                    ? 'Deleted User'
                    : (message.senderSnapshotName ?? 'Deleted User'),
              },
              imageCount: message.images.length,
              imageUrls: message.images.map((image) => image.imageUrl),
            })),
        };
      }),
    };
  },
  listChildConnections: async (managerUserId: string, childId: string) => {
    const child = await familyRepository.findChildById(managerUserId, childId);
    if (!child) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }

    const data = await familyRepository.listChildConnections(managerUserId, childId);

    return {
      child,
      connections: data.connections.map((connection) => {
        const otherUser = connection.userAId === childId ? connection.userB : connection.userA;

        return {
          id: connection.id,
          createdAt: connection.createdAt,
          user: mapConnectionUser(otherUser),
        };
      }),
      pendingApprovals: data.pendingApprovals.map((connection) => {
        const otherUser = connection.userAId === childId ? connection.userB : connection.userA;

        return {
          id: connection.id,
          createdAt: connection.createdAt,
          user: mapConnectionUser(otherUser),
        };
      }),
      incomingRequests: data.incomingRequests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        user: mapConnectionUser(request.sender),
      })),
      outgoingRequests: data.outgoingRequests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        user: mapConnectionUser(request.receiver),
      })),
    };
  },
  approvePendingConnection: async (managerUserId: string, childId: string, connectionId: string) => {
    const result = await familyRepository.approvePendingConnection(managerUserId, childId, connectionId);
    if (result.count === 0) {
      throw new AppError('PENDING_CONNECTION_NOT_FOUND', 'Pending child connection not found', 404);
    }
  },
  rejectPendingConnection: async (managerUserId: string, childId: string, connectionId: string) => {
    const result = await familyRepository.rejectPendingConnection(managerUserId, childId, connectionId);
    if (result.count === 0) {
      throw new AppError('PENDING_CONNECTION_NOT_FOUND', 'Pending child connection not found', 404);
    }
  },
  removeChildConnection: async (managerUserId: string, childId: string, connectionId: string) => {
    const result = await familyRepository.removeChildConnection(managerUserId, childId, connectionId);
    if (result.count === 0) {
      throw new AppError('CHILD_CONNECTION_NOT_FOUND', 'Child connection not found', 404);
    }
  },
  getFamilyCode: async (managerUserId: string) => {
    const manager = await authRepository.findUserById(managerUserId);
    if (!manager) {
      throw new AppError('USER_NOT_FOUND', 'Managing account not found', 404);
    }

    if (manager.role !== 'STANDARD') {
      throw new AppError('FORBIDDEN', 'Only standard accounts can manage family codes', 403);
    }

    const existingCode = await familyRepository.getFamilyCode(managerUserId);
    if (existingCode) {
      return { value: existingCode };
    }

    const code = randomBytes(5).toString('hex').toUpperCase();
    const updatedManager = await authRepository.updateFamilyCode(managerUserId, code);

    return {
      value: updatedManager.familyCode ?? code,
    };
  },
  releaseChild: async (managerUserId: string, childId: string) => {
    const result = await familyRepository.releaseChild(managerUserId, childId);
    if (result.count === 0) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }
  },
  deleteChild: async (managerUserId: string, childId: string) => {
    const result = await familyRepository.deleteChild(managerUserId, childId);
    if (result.count === 0) {
      throw new AppError('CHILD_NOT_FOUND', 'Child account not found', 404);
    }
  },
};
