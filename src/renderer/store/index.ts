/**
 * App global state — composed from domain slices.
 * Import `useAppStore` for the combined store, or slice types from `./types`.
 */
import { create } from "zustand";
import { createNavigationSlice } from "./navigation-slice";
import { createNotificationSlice } from "./notification-slice";
import { createSessionSlice } from "./session-slice";
import { createSettingsSlice } from "./settings-slice";
import type { AppStore } from "./types";
import { createUiSlice } from "./ui-slice";

export type {
  AppStore,
  NavigationSlice,
  NotificationSlice,
  SessionSlice,
  SettingsSlice,
  UiSlice,
} from "./types";

export const useAppStore = create<AppStore>()((...args) => ({
  ...createSettingsSlice(...args),
  ...createNavigationSlice(...args),
  ...createSessionSlice(...args),
  ...createNotificationSlice(...args),
  ...createUiSlice(...args),
}));
