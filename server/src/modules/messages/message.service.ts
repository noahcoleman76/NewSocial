import type { Express } from 'express';
import { AppError } from '@/lib/errors';
import { authRepository } from '@/modules/auth/auth.repository';
import { connectionRepository } from '@/modules/connections/connection.repository';
import { normalizeConnectionPair } from '@/modules/connections/connection.rules';
import { fileStorageService } from '@/modules/uploads/storage.service';
import { emitConversationUpdated, emitMessageCreated } from '@/sockets';
import { renderMessageSenderLabel } from './message.rules';
import { messagesRepository } from './messages.repository';

const buildDirectKey = (userOneId: string, userTwoId: string) => {
  const [userAId, userBId] = normalizeConnectionPair(userOneId, userTwoId);
  return `${userAId}:${userBId}`;
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

const ensureMessagingAllowed = async (userOneId: string, userTwoId: string) => {
  const [userOne, userTwo] = await Promise.all([ensureActiveUser(userOneId), ensureActiveUser(userTwoId)]);
  const familyRelation = await connectionRepository.findDirectFamilyRelation(userOneId, userTwoId);

  if (familyRelation) {
    return { userOne, userTwo };
  }

  const [userAId, userBId] = normalizeConnectionPair(userOneId, userTwoId);
  const connection = await connectionRepository.findConnectionByUsers(userAId, userBId);
  if (connection?.status !== 'ACTIVE') {
    throw new AppError('MESSAGING_NOT_ALLOWED', 'Only connected users can message each other', 403);
  }

  return { userOne, userTwo };
};

const mapConversation = (
  viewerId: string,
  conversation: Awaited<ReturnType<typeof messagesRepository.findConversationForUser>> extends infer T ? NonNullable<T> : never,
) => {
  const viewerParticipant = conversation.participants.find((participant) => participant.userId === viewerId);
  const otherParticipant = conversation.participants.find((participant) => participant.userId !== viewerId) ?? null;
  const latestMessage = conversation.messages[conversation.messages.length - 1] ?? null;

  return {
    id: conversation.id,
    participant: otherParticipant
      ? {
          id: otherParticipant.user.id,
          username: otherParticipant.user.username,
          displayName: otherParticipant.user.displayName,
          profileImageUrl: otherParticipant.user.profileImageUrl,
          deleted: otherParticipant.user.accountStatus !== 'ACTIVE',
          isFamilyLinked: otherParticipant.user.role === 'CHILD' || Boolean(otherParticipant.user.parentId),
        }
      : null,
    unread: Boolean(
      latestMessage &&
        viewerParticipant &&
        (!viewerParticipant.lastOpenedAt || latestMessage.createdAt > viewerParticipant.lastOpenedAt),
    ),
    updatedAt: conversation.updatedAt,
    preview: latestMessage
      ? latestMessage.body ?? `${latestMessage.images.length} image${latestMessage.images.length === 1 ? '' : 's'}`
      : 'No messages yet',
    messages: conversation.messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      author: {
        id: message.sender?.id ?? null,
        name: renderMessageSenderLabel({
          senderId: message.senderId,
          senderSnapshotName: message.senderSnapshotName,
          deletedSenderLabel: message.deletedSenderLabel,
        }),
      },
      imageUrls: message.images.map((image) => image.imageUrl),
      imageCount: message.images.length,
      isMine: message.senderId === viewerId,
    })),
  };
};

export const messageService = {
  renderMessageSenderLabel,

  listConversations: async (userId: string) => {
    await ensureActiveUser(userId);
    const participants = await messagesRepository.listConversationSummaries(userId);

    return participants.map((participant) => {
      const mapped = mapConversation(userId, participant.conversation);
      return {
        id: mapped.id,
        participant: mapped.participant,
        unread: mapped.unread,
        updatedAt: mapped.updatedAt,
        preview: mapped.preview,
      };
    });
  },

  getConversation: async (userId: string, conversationId: string) => {
    await ensureActiveUser(userId);
    const conversation = await messagesRepository.findConversationForUser(conversationId, userId);
    if (!conversation) {
      throw new AppError('CONVERSATION_NOT_FOUND', 'Conversation not found', 404);
    }

    return mapConversation(userId, conversation);
  },

  getOrCreateConversationWithUser: async (userId: string, otherUserId: string) => {
    if (userId === otherUserId) {
      throw new AppError('INVALID_CONVERSATION', 'You cannot message yourself', 422);
    }

    const { userOne, userTwo } = await ensureMessagingAllowed(userId, otherUserId);
    const directKey = buildDirectKey(userOne.id, userTwo.id);
    const existing = await messagesRepository.findConversationByDirectKey(directKey);

    if (existing) {
      return mapConversation(userId, existing);
    }

    const created = await messagesRepository.createConversation({
      directKey,
      userIds: [userOne.id, userTwo.id],
    });

    return mapConversation(userId, created);
  },

  openConversation: async (userId: string, conversationId: string) => {
    const conversation = await messagesRepository.findConversationForUser(conversationId, userId);
    if (!conversation) {
      throw new AppError('CONVERSATION_NOT_FOUND', 'Conversation not found', 404);
    }

    await messagesRepository.markConversationOpened(conversationId, userId);
    emitConversationUpdated([userId], { conversationId });
  },

  sendMessage: async (input: {
    conversationId: string;
    senderId: string;
    body?: string | null;
    files: Express.Multer.File[];
  }) => {
    const sender = await ensureActiveUser(input.senderId);
    const conversation = await messagesRepository.findConversationForUser(input.conversationId, input.senderId);
    if (!conversation) {
      throw new AppError('CONVERSATION_NOT_FOUND', 'Conversation not found', 404);
    }

    const otherParticipant = conversation.participants.find((participant) => participant.userId !== input.senderId);
    if (!otherParticipant) {
      throw new AppError('CONVERSATION_INVALID', 'Conversation is missing a recipient', 500);
    }

    await ensureMessagingAllowed(input.senderId, otherParticipant.userId);

    const trimmedBody = input.body?.trim() || null;
    if (!trimmedBody && input.files.length === 0) {
      throw new AppError('MESSAGE_EMPTY', 'A message needs text or images', 422);
    }

    const imageUrls = await Promise.all(input.files.map((file) => fileStorageService.saveImage(file, 'messages')));
    const message = await messagesRepository.createMessage({
      conversationId: input.conversationId,
      senderId: input.senderId,
      senderSnapshotName: sender.displayName,
      body: trimmedBody,
      imageUrls,
    });

    await messagesRepository.touchConversation(input.conversationId);
    await messagesRepository.markConversationOpened(input.conversationId, input.senderId);

    const participantIds = conversation.participants.map((participant) => participant.userId);
    emitMessageCreated(participantIds, {
      conversationId: input.conversationId,
      messageId: message.id,
    });
    emitConversationUpdated(participantIds, {
      conversationId: input.conversationId,
    });

    return {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      author: {
        id: message.sender?.id ?? null,
        name: renderMessageSenderLabel({
          senderId: message.senderId,
          senderSnapshotName: message.senderSnapshotName,
          deletedSenderLabel: message.deletedSenderLabel,
        }),
      },
      imageUrls: message.images.map((image) => image.imageUrl),
      imageCount: message.images.length,
      isMine: true,
    };
  },
};
