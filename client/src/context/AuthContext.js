import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY, USER_KEY } from '../api/axios';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (error) {
    return null;
  }
};

/**
 * Auth provider: keeps the JWT + user in state and localStorage.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const persist = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setToken(stored);
      return data.user;
    } catch (error) {
      clear();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => clear();
    window.addEventListener('agritech:unauthorized', handler);
    return () => window.removeEventListener('agritech:unauthorized', handler);
  }, [clear]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Stateless logout: ignore network errors and clear locally.
    }
    clear();
  }, [clear]);

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
      updateUser
    }),
    [user, token, loading, login, register, logout, refresh, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
