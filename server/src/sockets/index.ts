import type { Server as HttpServer } from 'node:http';
import type { Server as SocketServer } from 'socket.io';
import { Server } from 'socket.io';
import { env } from '@/config/env';
import { verifyAccessToken } from '@/modules/auth/auth.tokens';

let io: SocketServer | null = null;

const userRoom = (userId: string) => `user:${userId}`;

export const registerSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null;
    if (!token) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));
  });

  return io;
};

export const emitConversationUpdated = (userIds: string[], payload: { conversationId: string }) => {
  if (!io) {
    return;
  }

  for (const userId of userIds) {
    io.to(userRoom(userId)).emit('conversation:updated', payload);
  }
};

export const emitMessageCreated = (
  userIds: string[],
  payload: {
    conversationId: string;
    messageId: string;
  },
) => {
  if (!io) {
    return;
  }

  for (const userId of userIds) {
    io.to(userRoom(userId)).emit('message:new', payload);
  }
};

