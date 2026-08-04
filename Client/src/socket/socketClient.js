import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

export function connectSocket(token) {
  if (!token) {
    disconnectSocket();
    return null;
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL;

  if (!socketUrl) {
    console.error('VITE_SOCKET_URL is required to establish a realtime connection.');
    return null;
  }

  // Tab-level singleton: reuse active connection if token matches
  if (socket && (socket.connected || socket.active) && currentToken === token) {
    return socket;
  }

  // If token changed or existing socket is disconnected, clean up old instance
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(socketUrl, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect_error', (error) => {
    console.error('Socket authentication handshake error:', error.message || error);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
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
