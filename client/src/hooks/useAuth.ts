"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.user && !store.isLoading) {
      store.checkAuth();
    }
  }, []);

  return store;
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return { isAuthenticated, isLoading };
}
