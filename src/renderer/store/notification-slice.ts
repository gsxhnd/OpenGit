import type { AppNotification, Toast } from "@shared/types";
import type { AppStoreCreator, NotificationSlice } from "./types";

let toastCounter = 0;

export const createNotificationSlice: AppStoreCreator<NotificationSlice> = (
  set,
) => ({
  toasts: [],
  notifications: [],

  addToast: (message, kind) => {
    const id = `toast-${++toastCounter}`;
    const createdAt = Date.now();
    const toast: Toast = { id, message, kind, createdAt };
    const notification: AppNotification = {
      id,
      message,
      kind,
      createdAt,
      read: false,
    };
    set((state) => ({
      toasts: [...state.toasts.slice(-4), toast],
      notifications: [...state.notifications, notification].slice(-50),
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  markNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.read ? n : { ...n, read: true },
      ),
    }));
  },
});
