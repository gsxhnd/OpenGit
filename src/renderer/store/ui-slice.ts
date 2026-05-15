import type { AppStoreCreator, UiSlice } from "./types";

export const createUiSlice: AppStoreCreator<UiSlice> = (set) => ({
  inspectorOpen: false,
  commandPaletteOpen: false,

  setInspectorOpen: (open) => set({ inspectorOpen: open }),

  toggleInspector: () =>
    set((state) => ({ inspectorOpen: !state.inspectorOpen })),

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
});
