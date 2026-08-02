import { createContext, useEffect, useMemo, useState } from 'react';
import authApi from '../api/auth.api.js';

export const AuthContext = createContext(null);
const TOKEN_KEY = 'collix_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    let isMounted = true;
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((data) => {
        if (isMounted) {
          const activeUser = data.user || data;
          setUser(activeUser);
          setToken(storedToken);
        }
      })
      .catch((error) => {
        console.error('Session restoration failed:', error.message || error);
        if (isMounted) {
          logout();
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    const jwtToken = data.token;
    if (jwtToken) {
      localStorage.setItem(TOKEN_KEY, jwtToken);
      setToken(jwtToken);
    }
    // Build authenticated user state from /auth/me after login
    const meData = await authApi.getMe();
    const activeUser = meData.user || meData;
    setUser(activeUser);
    return activeUser;
  };

  const register = async ({ username, email, password }) => {
    const data = await authApi.register({ username, email, password });
    const jwtToken = data.token;
    if (jwtToken) {
      localStorage.setItem(TOKEN_KEY, jwtToken);
      setToken(jwtToken);
    }
    // Build authenticated user state from /auth/me after registration
    const meData = await authApi.getMe();
    const activeUser = meData.user || meData;
    setUser(activeUser);
    return activeUser;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: Boolean(user && token),
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
