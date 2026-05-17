import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@renderer/store";
import { useShallow } from "zustand/react/shallow";
import type { Language } from "@renderer/i18n/translations";

export function useSettingsDraftState() {
  const { t } = useTranslation();
  const { settings, loadSettings, updateSettings, addToast, setLanguage, language } =
    useAppStore(
      useShallow((s) => ({
        settings: s.settings,
        loadSettings: s.loadSettings,
        updateSettings: s.updateSettings,
        addToast: s.addToast,
        setLanguage: s.setLanguage,
        language: s.language,
      })),
    );

  const [theme, setTheme] = useState(settings?.theme ?? "Standard Dark");
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  const [termValues, setTermValues] = useState({
    fontSize: settings?.terminal.fontSize ?? 14,
    scrollback: settings?.terminal.scrollback ?? 5000,
    fontFamily:
      settings?.terminal.fontFamily ??
      'Menlo, Monaco, "Courier New", monospace',
    cursorStyle: settings?.terminal.cursorStyle ?? "block",
    windowsShell: settings?.terminal.windowsShell ?? "powershell",
  });

  const [edValues, setEdValues] = useState({
    fontSize: settings?.editor.fontSize ?? 14,
    tabSize: settings?.editor.tabSize ?? 2,
    wordWrap: (settings?.editor.wordWrap ?? "off") === "on",
    minimap: settings?.editor.minimap ?? true,
  });

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setTermValues({
        fontSize: settings.terminal.fontSize,
        scrollback: settings.terminal.scrollback,
        fontFamily: settings.terminal.fontFamily,
        cursorStyle: settings.terminal.cursorStyle,
        windowsShell: settings.terminal.windowsShell,
      });
      setEdValues({
        fontSize: settings.editor.fontSize,
        tabSize: settings.editor.tabSize,
        wordWrap: settings.editor.wordWrap === "on",
        minimap: settings.editor.minimap,
      });
    }
  }, [settings]);

  const handleThemeChange = useCallback(
    (newTheme: string) => {
      setTheme(newTheme);
      void updateSettings({ theme: newTheme });
    },
    [updateSettings],
  );

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setSelectedLang(lang);
      void setLanguage(lang);
      addToast(t("settings.languageChanged"), "success");
    },
    [setLanguage, addToast, t],
  );

  const updateTermField = useCallback(
    <K extends keyof typeof termValues>(key: K, value: (typeof termValues)[K]) =>
      setTermValues((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const updateEdField = useCallback(
    <K extends keyof typeof edValues>(key: K, value: (typeof edValues)[K]) =>
      setEdValues((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const saveTerminal = useCallback(() => {
    void updateSettings({
      terminal: {
        fontSize: termValues.fontSize,
        scrollback: termValues.scrollback,
        fontFamily: termValues.fontFamily,
        cursorStyle: termValues.cursorStyle as "block" | "underline" | "bar",
        windowsShell: termValues.windowsShell as "powershell" | "cmd" | "wsl",
      },
    });
    addToast(t("settings.terminalSaved"), "success");
  }, [termValues, updateSettings, addToast, t]);

  const saveEditor = useCallback(() => {
    void updateSettings({
      editor: {
        fontSize: edValues.fontSize,
        tabSize: edValues.tabSize,
        wordWrap: edValues.wordWrap ? "on" : "off",
        minimap: edValues.minimap,
      },
    });
    addToast(t("settings.editorSaved"), "success");
  }, [edValues, updateSettings, addToast, t]);

  return {
    settings,
    theme,
    selectedLang,
    termValues,
    edValues,
    handleThemeChange,
    handleLanguageChange,
    updateTermField,
    updateEdField,
    saveTerminal,
    saveEditor,
  };
}
