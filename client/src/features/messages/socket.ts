import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketToken: string | null = null;

export const getMessageSocket = (token: string) => {
  const url = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:4000';

  if (socket && socket.connected && socketToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(url, {
    autoConnect: true,
    auth: {
      token,
    },
    withCredentials: true,
  });
  socketToken = token;

  return socket;
};

export const disconnectMessageSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
  socketToken = null;
};
