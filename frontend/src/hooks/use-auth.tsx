import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export interface UserPermissions {
  fleet: "NONE" | "VIEW" | "EDIT";
  drivers: "NONE" | "VIEW" | "EDIT";
  trips: "NONE" | "VIEW" | "EDIT";
  maintenance: "NONE" | "VIEW" | "EDIT";
  fuelExpenses: "NONE" | "VIEW" | "EDIT";
  analytics: "NONE" | "VIEW" | "EDIT";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";
  permissions: UserPermissions;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (module: keyof UserPermissions, level: "VIEW" | "EDIT") => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (credentials: any) => {
    const response = await api.post("/auth/login", credentials);
    const loggedUser = response.data.user;
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (data: any) => {
    const response = await api.post("/auth/register", data);
    const registeredUser = response.data.user;
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.role === "ADMIN";

  const hasPermission = (module: keyof UserPermissions, level: "VIEW" | "EDIT"): boolean => {
    if (!user) return false;
    // ADMIN has full access to everything
    if (user.role === "ADMIN") return true;

    const userPerm = user.permissions?.[module];
    if (!userPerm) return false;

    if (level === "EDIT") return userPerm === "EDIT";
    if (level === "VIEW") return userPerm === "VIEW" || userPerm === "EDIT";
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasPermission, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
