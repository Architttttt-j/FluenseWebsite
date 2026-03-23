"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface User {
  id: string; name: string; email: string; role: string;
  region?: string; regionId?: string; phone?: string;
  dob?: string; joinDate?: string; status: string; avatarUrl?: string;
}

interface AuthCtx {
  currentUser: User | null;
  activeUser: User | null;
  impersonating: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  impersonateUser: (id: string) => Promise<void>;
  stopImpersonating: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonating, setImpersonating] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const activeUser = impersonating || currentUser;

  useEffect(() => {
    const token = localStorage.getItem("fluense_token");
    if (token) {
      api.getMe()
        .then((u: User) => setCurrentUser(u))
        .catch(() => localStorage.removeItem("fluense_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      localStorage.setItem("fluense_token", data.access_token);
      setCurrentUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fluense_token");
    sessionStorage.removeItem("fluense_original_token");
    setCurrentUser(null);
    setImpersonating(null);
    router.push("/login");
  }, [router]);

  const impersonateUser = useCallback(async (id: string) => {
    const original = localStorage.getItem("fluense_token");
    sessionStorage.setItem("fluense_original_token", original!);
    const data = await api.impersonate(id);
    localStorage.setItem("fluense_token", data.access_token);
    setImpersonating(data.user);
  }, []);

  const stopImpersonating = useCallback(() => {
    const original = sessionStorage.getItem("fluense_original_token");
    if (original) {
      localStorage.setItem("fluense_token", original);
      sessionStorage.removeItem("fluense_original_token");
    }
    setImpersonating(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, activeUser, impersonating, loading, login, logout, impersonateUser, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
