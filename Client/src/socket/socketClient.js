import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (!token) return null;
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

const socketClient = {
  connectSocket,
  disconnectSocket,
  getSocket,
};

export default socketClient;
