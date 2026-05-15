import type { StateCreator } from "zustand";
import type {
  AppNotification,
  AppSettings,
  RemoteSessionMeta,
  SessionStatus,
  Toast,
  ToastKind,
  ViewType,
} from "@shared/types";
import type { Language } from "../i18n/translations";

export interface SettingsSlice {
  settings: AppSettings | null;
  language: Language;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
}

export interface NavigationSlice {
  currentView: ViewType;
  previousView: ViewType | null;
  setView: (view: ViewType) => void;
  goBack: () => void;
}

export interface SessionSlice {
  sessions: RemoteSessionMeta[];
  activeSessionId: string | null;
  addSession: (meta: RemoteSessionMeta) => void;
  removeSession: (connectionId: string) => void;
  setActiveSessionId: (connectionId: string | null) => void;
  updateSessionStatus: (connectionId: string, status: SessionStatus) => void;
}

export interface NotificationSlice {
  toasts: Toast[];
  notifications: AppNotification[];
  addToast: (message: string, kind: ToastKind) => void;
  removeToast: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationsRead: () => void;
}

export interface UiSlice {
  secondPanelOpen: boolean;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  setSecondPanelOpen: (open: boolean) => void;
  toggleSecondPanel: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

export type AppStore = SettingsSlice &
  NavigationSlice &
  SessionSlice &
  NotificationSlice &
  UiSlice;

export type AppStoreCreator<T> = StateCreator<AppStore, [], [], T>;
