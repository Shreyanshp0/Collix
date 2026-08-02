import { createContext, useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth.jsx';
import { connectSocket, disconnectSocket } from '../socket/socketClient.js';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const socketInstance = connectSocket(token);
    setSocket(socketInstance);

    if (socketInstance) {
      setIsConnected(socketInstance.connected);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      socketInstance.on('connect', onConnect);
      socketInstance.on('disconnect', onDisconnect);

      return () => {
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
      };
    }
  }, [token, isAuthenticated]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [socket, isConnected],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
