import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuthToken } from "../api/client";
import { me, logout } from "../api/auth";
import { setChangeAlertsUser } from "../utils/changeAlerts";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getAuthToken();
    if (!t) {
      setLoading(false);
      return;
    }
    me()
      .then(setUser)
      .catch(() => {
        logout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setChangeAlertsUser(user?.id ?? null);
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
