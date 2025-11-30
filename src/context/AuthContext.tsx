import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ReactNode } from "react";
import { RootState, AppDispatch } from "@/store";
import {
  checkAuth,
  login as loginAction,
  logout as logoutAction,
} from "@/store/authSlice";

type AuthContextType = {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  refresh: () => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState<boolean>(
    authState.status === "loading"
  );

  useEffect(() => {
    // On mount, attempt to validate token and fetch user
    (async () => {
      setLoading(true);
      await dispatch(checkAuth());
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await dispatch(loginAction({ email, password })).unwrap();
      // Ensure auth state is refreshed after login
      await dispatch(checkAuth());
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => dispatch(logoutAction());

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await dispatch(checkAuth()).unwrap();
      return res;
    } catch (e) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user: authState.user, loading, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
