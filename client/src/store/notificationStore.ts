import { create } from "zustand";
import type { INotification } from "@/types";
import { notificationApi } from "@/lib/api.service";
import { connectSocket } from "@/lib/socket";

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: INotification) => void;
  initSocketListener: () => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const result = await notificationApi.getNotifications(page);
      set({
        notifications: result.notifications,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // silently fail
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  initSocketListener: () => {
    const socket = connectSocket();
    if (!socket) return () => {};

    const handler = (notification: INotification) => {
      get().addNotification(notification);
    };

    socket.on("notification:new", handler);

    return () => {
      socket.off("notification:new", handler);
    };
  },
}));
