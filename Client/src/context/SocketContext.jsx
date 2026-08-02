import { createContext, useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth.jsx';
import { connectSocket, disconnectSocket } from '../socket/socketClient.js';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    const socketInstance = connectSocket(token);
    setSocket(socketInstance);

    if (socketInstance) {
      setIsConnected(socketInstance.connected);

      const onConnect = () => {
        setIsConnected(true);
        setConnectionError(null);
      };

      const onDisconnect = (reason) => {
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          setConnectionError('Server disconnected the connection');
        }
      };

      const onConnectError = (error) => {
        setIsConnected(false);
        setConnectionError(error?.message || 'Failed to authenticate socket connection');
      };

      // Off before on to guarantee no duplicate listeners
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onConnectError);

      socketInstance.on('connect', onConnect);
      socketInstance.on('disconnect', onDisconnect);
      socketInstance.on('connect_error', onConnectError);

      return () => {
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
        socketInstance.off('connect_error', onConnectError);
      };
    }
  }, [token, isAuthenticated]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      connectionError,
    }),
    [socket, isConnected, connectionError],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
