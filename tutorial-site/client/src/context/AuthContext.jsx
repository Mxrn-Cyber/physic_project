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

  // Signup verification is currently off server-side, so /register returns
  // a token/user right away and we log the user in immediately. If it's
  // ever turned back on, the server instead returns {email, channel} with
  // no token, and the caller (Register.jsx) sends the user to /verify-otp.
  const register = useCallback(
    async (name, email, password, opts) => {
      const data = await api.register(name, email, password, opts);
      if (data.token) {
        applySession(data.token, data.user);
      }
      return data;
    },
    [applySession]
  );

  const verifyOtp = useCallback(
    async (email, code, purpose = "signup") => {
      const data = await api.verifyOtp(email, code, purpose);
      if (purpose === "signup" && data.token) {
        applySession(data.token, data.user);
      }
      return data;
    },
    [applySession]
  );

  const resendOtp = useCallback(
    (email, purpose = "signup", channel) => api.resendOtp(email, purpose, channel),
    []
  );

  const googleLogin = useCallback(
    async (credential) => {
      const { token, user } = await api.googleAuth(credential);
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
    <AuthContext.Provider
      value={{ user, loading, login, register, verifyOtp, resendOtp, googleLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
