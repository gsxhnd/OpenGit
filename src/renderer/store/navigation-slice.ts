import type { AppStoreCreator, NavigationSlice } from "./types";

export const createNavigationSlice: AppStoreCreator<NavigationSlice> = (
  set,
  get,
) => ({
  currentView: "dashboard",
  previousView: null,

  setView: (view) => {
    const current = get().currentView;
    set({ currentView: view, previousView: current });
  },

  goBack: () => {
    const prev = get().previousView;
    if (prev) {
      set({ currentView: prev, previousView: null });
    }
  },
});
