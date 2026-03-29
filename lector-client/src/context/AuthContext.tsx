import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { User, LoginRequest, RegisterRequest } from "@/types/auth";
import { API_AUTH_LOGIN, API_AUTH_REGISTER, API_AUTH_LOGOUT, API_AUTH_ME, ROUTES } from "@/constants";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();
    
    const checkAuth = async () => {
      try {
        const res = await fetch(API_AUTH_ME, { 
          credentials: "include",
          signal: abortRef.current.signal 
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ email: data.email, userName: data.userName });
        }
      } catch {
        // not logged in or network error
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
    
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const refreshUser = async () => {
    const res = await fetch(API_AUTH_ME, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setUser({ email: data.email, userName: data.userName });
    }
  };

  const login = async (data: LoginRequest) => {
    const res = await fetch(API_AUTH_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Login failed");
    }

    await refreshUser();
  };

  const register = async (data: RegisterRequest) => {
    const res = await fetch(API_AUTH_REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Registration failed");
    }

    await refreshUser();
  };

  const logout = async () => {
    try {
      await fetch(API_AUTH_LOGOUT, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore errors, clear local state anyway
    }
    setUser(null);
    navigate(ROUTES.login);
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
