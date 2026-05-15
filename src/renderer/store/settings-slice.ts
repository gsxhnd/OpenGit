import type { Language } from "../i18n/translations";
import type { AppStoreCreator, SettingsSlice } from "./types";

export const createSettingsSlice: AppStoreCreator<SettingsSlice> = (
  set,
  get,
) => ({
  settings: null,
  language: "en",

  loadSettings: async () => {
    const settings = await window.api.getSettings();
    set({
      settings,
      language: (settings.language as Language) || "en",
    });
  },

  updateSettings: async (partial) => {
    const updated = await window.api.setSettings(partial);
    set({ settings: updated });
  },

  setLanguage: async (language) => {
    const s = get().settings;
    if (s) {
      await get().updateSettings({ ...s, language });
      set({ language });
    }
  },
});
