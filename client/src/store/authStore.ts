import { create } from "zustand";
import type { IUser, LoginInput, RegisterInput } from "@/types";
import { authApi } from "@/lib/api.service";
import { setAccessToken } from "@/lib/axios";
import { connectSocket, disconnectSocket } from "@/lib/socket";

const TOKEN_KEY = "snapconnect_access_token";

const persistToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch { /* localStorage unavailable */ }
};

const restoreToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const clearPersistedToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* localStorage unavailable */ }
};

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: IUser | null) => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.login(input);
      setAccessToken(result.accessToken);
      persistToken(result.accessToken);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
      connectSocket();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid email or password";
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  register: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.register(input);
      setAccessToken(result.accessToken);
      persistToken(result.accessToken);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
      connectSocket();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with local logout even if API fails
    } finally {
      setAccessToken(null);
      clearPersistedToken();
      disconnectSocket();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const stored = restoreToken();
      if (stored) setAccessToken(stored);

      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
      connectSocket();
    } catch {
      setAccessToken(null);
      clearPersistedToken();
      disconnectSocket();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
