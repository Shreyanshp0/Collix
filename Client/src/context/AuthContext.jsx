import { createContext, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

const mockUser = {
  id: 'mock-user-1',
  username: 'Demo User',
  email: 'demo@collix.app',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (payload = {}) => {
    setUser({
      ...mockUser,
      ...payload,
    });
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
