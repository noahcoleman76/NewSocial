import { AppError } from '@/lib/errors';
import { authRepository } from '@/modules/auth/auth.repository';
import { connectionRepository } from './connection.repository';
import { normalizeConnectionPair, resolveConnectionRequestOutcome } from './connection.rules';

const mapRelationshipUser = (user: {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  role: 'STANDARD' | 'CHILD' | 'ADMIN';
  parentId: string | null;
}) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  profileImageUrl: user.profileImageUrl,
  isFamilyLinked: user.role === 'CHILD' || Boolean(user.parentId),
});

const isDirectFamilyConnection = (userOne: { id: string; parentId: string | null }, userTwo: { id: string; parentId: string | null }) =>
  userOne.parentId === userTwo.id || userTwo.parentId === userOne.id;

const resolveManagerApproval = (users: Array<{ role: 'STANDARD' | 'CHILD' | 'ADMIN'; parentId: string | null }>) => {
  const childUser = users.find((user) => user.role === 'CHILD' && user.parentId);

  if (!childUser?.parentId) {
    return {
      required: false,
      approvingManagerId: null,
    };
  }

  return {
    required: true,
    approvingManagerId: childUser.parentId,
  };
};

const ensureActiveUser = async (userId: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError('ACCOUNT_DISABLED', 'This account is not active', 403);
  }

  if (user.role === 'CHILD' && user.parent?.accountStatus !== 'ACTIVE') {
    throw new AppError('ACCOUNT_DISABLED', 'This child account requires an active family manager', 403);
  }

  return user;
};

export const buildConnectionRequestPlan = resolveConnectionRequestOutcome;

export const connectionService = {
  searchUsers: async (requesterId: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const requester = await ensureActiveUser(requesterId);
    const users = await connectionRepository.searchUsers(requesterId, trimmed, requester.role === 'ADMIN');

    return users.map((user) => {
      const familyConnection = isDirectFamilyConnection(requester, user);
      const connection = user.connectionsA[0] ?? user.connectionsB[0] ?? null;
      const outgoingRequest = user.incomingRequests[0] ?? null;
      const incomingRequest = user.outgoingRequests[0] ?? null;

      let relationship:
        | 'NONE'
        | 'CONNECTED'
        | 'OUTGOING_REQUEST'
        | 'INCOMING_REQUEST'
        | 'PENDING_MANAGER_APPROVAL' = 'NONE';

      if (familyConnection || connection?.status === 'ACTIVE') {
        relationship = 'CONNECTED';
      } else if (connection?.status === 'PENDING_MANAGER_APPROVAL') {
        relationship = 'PENDING_MANAGER_APPROVAL';
      } else if (outgoingRequest) {
        relationship = 'OUTGOING_REQUEST';
      } else if (incomingRequest) {
        relationship = 'INCOMING_REQUEST';
      }

      return {
        ...mapRelationshipUser(user),
        isFamilyConnection: familyConnection,
        relationship,
        requestId: outgoingRequest?.id ?? incomingRequest?.id ?? null,
      };
    });
  },

  listConnections: async (userId: string) => {
    const user = await ensureActiveUser(userId);

    const [connections, familyConnectionIds, pendingApprovals, incomingRequests, outgoingRequests] = await Promise.all([
      connectionRepository.listActiveConnections(userId),
      connectionRepository.listFamilyConnectionIds(userId),
      connectionRepository.listPendingApprovalConnections(userId),
      connectionRepository.listIncomingRequests(userId),
      connectionRepository.listOutgoingRequests(userId),
    ]);

    const familyConnections = await Promise.all(
      familyConnectionIds.map(async (familyUserId) => {
        const familyUser = await ensureActiveUser(familyUserId);

        return {
          id: `family-${userId}-${familyUser.id}`,
          createdAt: familyUser.createdAt,
          user: {
            ...mapRelationshipUser(familyUser),
            isFamilyConnection: true,
          },
        };
      }),
    );

    return {
      connections: [
        ...familyConnections,
        ...connections
          .filter((connection) => {
            const otherUser = connection.userAId === userId ? connection.userB : connection.userA;
            return !isDirectFamilyConnection(user, otherUser);
          })
          .map((connection) => {
            const otherUser = connection.userAId === userId ? connection.userB : connection.userA;

            return {
              id: connection.id,
              createdAt: connection.createdAt,
              user: {
                ...mapRelationshipUser(otherUser),
                isFamilyConnection: false,
              },
            };
          }),
      ],
      pendingApprovals:
        user.role === 'CHILD'
          ? pendingApprovals.map((connection) => {
              const otherUser = connection.userAId === userId ? connection.userB : connection.userA;

              return {
                id: connection.id,
                createdAt: connection.createdAt,
                user: mapRelationshipUser(otherUser),
              };
            })
          : [],
      incomingRequests: incomingRequests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        user: mapRelationshipUser(request.sender),
      })),
      outgoingRequests: outgoingRequests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        user: mapRelationshipUser(request.receiver),
      })),
    };
  },

  createRequest: async (senderId: string, receiverId: string) => {
    const [sender, receiver] = await Promise.all([ensureActiveUser(senderId), ensureActiveUser(receiverId)]);

    if (senderId === receiverId) {
      throw new AppError('INVALID_CONNECTION', 'Users cannot connect with themselves', 422);
    }

    const [userAId, userBId] = normalizeConnectionPair(senderId, receiverId);
    const existingConnection = await connectionRepository.findConnectionByUsers(userAId, userBId);

    if (existingConnection?.status === 'ACTIVE') {
      throw new AppError('CONNECTION_EXISTS', 'Users are already connected', 409);
    }

    if (existingConnection?.status === 'PENDING_MANAGER_APPROVAL') {
      throw new AppError(
        'CONNECTION_PENDING_MANAGER_APPROVAL',
        'This connection is waiting for family approval',
        409,
      );
    }

    const existingRequest = await connectionRepository.findRequestByUsers(senderId, receiverId);
    if (existingRequest?.status === 'PENDING') {
      throw new AppError('REQUEST_ALREADY_PENDING', 'Connection request is already pending', 409);
    }

    const reverseRequest = await connectionRepository.findRequestByUsers(receiverId, senderId);
    const managerApproval = resolveManagerApproval([sender, receiver]);

    const outcome = resolveConnectionRequestOutcome({
      senderId,
      receiverId,
      reverseRequest,
      managerApprovalRequired: managerApproval.required,
      approvingManagerId: managerApproval.approvingManagerId,
    });

    if (outcome.mode === 'PENDING') {
      const request = await connectionRepository.upsertPendingRequest(senderId, receiverId);
      return {
        outcome: 'REQUEST_PENDING' as const,
        requestId: request.id,
      };
    }

    const autoAcceptOutcome = outcome;

    await Promise.all(
      autoAcceptOutcome.updates.map((update) => {
        if ('requestId' in update && typeof update.requestId === 'string') {
          return connectionRepository.updateRequestStatus(update.requestId, update.status);
        }

        return connectionRepository.upsertPendingRequest(update.senderId, update.receiverId).then((request) =>
          connectionRepository.updateRequestStatus(request.id, 'AUTO_ACCEPTED'),
        );
      }),
    );

    const connection = autoAcceptOutcome.connection!;

    await connectionRepository.createConnection({
      userAId: connection.userAId,
      userBId: connection.userBId,
      status: connection.status,
      approvingManagerId: connection.approvingManagerId,
    });

    return {
      outcome: connection.status === 'PENDING_MANAGER_APPROVAL' ? ('PENDING_MANAGER_APPROVAL' as const) : ('CONNECTED' as const),
      requestId: null,
    };
  },

  acceptRequest: async (userId: string, requestId: string) => {
    const request = await connectionRepository.findRequestById(requestId);
    if (!request || request.status !== 'PENDING') {
      throw new AppError('REQUEST_NOT_FOUND', 'Connection request not found', 404);
    }

    if (request.receiverId !== userId) {
      throw new AppError('FORBIDDEN', 'Only the receiver can accept this request', 403);
    }

    const [sender, receiver] = await Promise.all([ensureActiveUser(request.senderId), ensureActiveUser(request.receiverId)]);

    const [userAId, userBId] = normalizeConnectionPair(sender.id, receiver.id);
    const existingConnection = await connectionRepository.findConnectionByUsers(userAId, userBId);

    if (existingConnection?.status === 'ACTIVE') {
      throw new AppError('CONNECTION_EXISTS', 'Users are already connected', 409);
    }

    if (existingConnection?.status === 'PENDING_MANAGER_APPROVAL') {
      throw new AppError(
        'CONNECTION_PENDING_MANAGER_APPROVAL',
        'This connection is waiting for family approval',
        409,
      );
    }

    const managerApproval = resolveManagerApproval([sender, receiver]);

    await connectionRepository.updateRequestStatus(request.id, 'ACCEPTED');
    await connectionRepository.createConnection({
      userAId,
      userBId,
      status: managerApproval.required ? 'PENDING_MANAGER_APPROVAL' : 'ACTIVE',
      approvingManagerId: managerApproval.approvingManagerId,
    });

    return {
      outcome: managerApproval.required ? ('PENDING_MANAGER_APPROVAL' as const) : ('CONNECTED' as const),
    };
  },

  cancelRequest: async (userId: string, requestId: string) => {
    const request = await connectionRepository.findRequestById(requestId);
    if (!request || request.status !== 'PENDING') {
      throw new AppError('REQUEST_NOT_FOUND', 'Connection request not found', 404);
    }

    if (request.senderId !== userId) {
      throw new AppError('FORBIDDEN', 'Only the sender can cancel this request', 403);
    }

    await connectionRepository.updateRequestStatus(request.id, 'CANCELED');
  },

  removeConnection: async (userId: string, otherUserId: string) => {
    const [user, otherUser] = await Promise.all([ensureActiveUser(userId), ensureActiveUser(otherUserId)]);

    if (isDirectFamilyConnection(user, otherUser)) {
      throw new AppError('FORBIDDEN', 'Family-linked accounts cannot be disconnected', 403);
    }

    const [userAId, userBId] = normalizeConnectionPair(userId, otherUserId);
    const result = await connectionRepository.removeActiveConnection(userAId, userBId);

    if (result.count === 0) {
      throw new AppError('CONNECTION_NOT_FOUND', 'Active connection not found', 404);
    }
  },
};

