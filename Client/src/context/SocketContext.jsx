import { createContext, useMemo } from 'react';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const value = useMemo(
    () => ({
      socket: null,
      isConnected: false,
    }),
    [],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
