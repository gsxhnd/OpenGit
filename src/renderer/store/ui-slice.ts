import type { AppStoreCreator, UiSlice } from "./types";

export const createUiSlice: AppStoreCreator<UiSlice> = (set) => ({
  primaryPanelOpen: true,
  secondPanelOpen: false,
  commandPaletteOpen: false,
  settingsOpen: false,
  addHostOpen: false,

  setPrimaryPanelOpen: (open) => set({ primaryPanelOpen: open }),

  togglePrimaryPanel: () =>
    set((state) => ({ primaryPanelOpen: !state.primaryPanelOpen })),

  setSecondPanelOpen: (open) => set({ secondPanelOpen: open }),

  toggleSecondPanel: () =>
    set((state) => ({ secondPanelOpen: !state.secondPanelOpen })),

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  setAddHostOpen: (open) => set({ addHostOpen: open }),
});
