import { create } from "zustand";
import api from "../services/api";
import type { User, AuthTokens } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })(),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("tokens", JSON.stringify(data.tokens));
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      localStorage.setItem("tokens", JSON.stringify(data.tokens));
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    set({ user: null });
  },

  loadUser: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data });
      localStorage.setItem("user", JSON.stringify(data));
    } catch {
      set({ user: null });
      localStorage.removeItem("tokens");
      localStorage.removeItem("user");
    }
  },
}));
