import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { isAuthenticated, login as apiLogin, logout as apiLogout, getProfile } from "@/lib/api";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  status: string;
  type: string;
  gender: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getProfile();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
