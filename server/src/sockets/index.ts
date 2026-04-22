import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '@/config/env';

export const registerSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.emit('conversation:updated', { ok: true });
  });

  return io;
};
