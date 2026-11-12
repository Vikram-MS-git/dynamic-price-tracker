import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only "loading" if there is a saved token we need to verify.
  const [loading, setLoading] = useState(() => !!tokenStore.get());

  // An expired or revoked token anywhere in the app signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    api
      .me()
      .then(({ user: u }) => alive && setUser(u))
      .catch(() => {
        /* 401 already cleared the token; a network error leaves the user at the login page */
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u, token } = await api.login({ email, password });
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { user: u, token } = await api.register({ name, email, password });
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const { user: u } = await api.updateMe(data);
    setUser((cur) => ({ ...cur, ...u }));
    return u;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
