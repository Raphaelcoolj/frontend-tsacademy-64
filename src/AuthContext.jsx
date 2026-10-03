import { useCallback, useEffect, useState } from "react";
import * as authService from "./api/auth";
import { AuthContext } from "./lib/authContext";
import { clearSession, getToken, getUser, setSession } from "./lib/session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [initializing, setInitializing] = useState(() => Boolean(getToken()));

  // Re-resolve the session with GET /auth/me after a page reload (README §7).
  // No stored token → the initial state above is already correct, nothing to do.
  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;

    authService
      .me()
      .then((meUser) => {
        if (!cancelled) setUser(meUser);
      })
      .catch(() => {
        // 401 already cleared the stored token in the client interceptor.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((session) => {
    setSession(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.location.assign("/");
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
