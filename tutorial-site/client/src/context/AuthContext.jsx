import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAuthToken } from "../api/client.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "tutorhub_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setAuthToken(stored);
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const applySession = useCallback((token, user) => {
    localStorage.setItem(STORAGE_KEY, token);
    setAuthToken(token);
    setUser(user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token, user } = await api.login(email, password);
      applySession(token, user);
    },
    [applySession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const { token, user } = await api.register(name, email, password);
      applySession(token, user);
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user } = await api.me();
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
