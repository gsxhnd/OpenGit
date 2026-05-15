import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { Language } from "../i18n/translations";
import {
  PaletteIcon,
  TerminalIcon,
  FileTextIcon,
  NetworkIcon,
  KeyboardIcon,
} from "lucide-react";
import { AppearanceSection } from "../components/settings/AppearanceSection";
import { TerminalSection } from "../components/settings/TerminalSection";
import { EditorSection } from "../components/settings/EditorSection";
import { HostsSection } from "../components/settings/HostsSection";
import { SettingsPanel } from "../components/settings/SettingsPanel";
import styles from "./SettingsView.module.scss";

const isDarwin = window.api.platform === "darwin";
const modKey = isDarwin ? "\u2318" : "Ctrl";

type SettingsSection = "appearance" | "terminal" | "editor" | "hosts" | "shortcuts";

interface NavEntry {
  id: SettingsSection;
  label: string;
  Icon: typeof PaletteIcon;
}

interface ShortcutEntry {
  label: string;
  shortcut: string;
}

const SECTION_META: Record<
  SettingsSection,
  { titleKey: string; descKey: string; wide?: boolean }
> = {
  appearance: {
    titleKey: "settings.appearance",
    descKey: "settings.appearanceDesc",
  },
  terminal: {
    titleKey: "settings.terminal",
    descKey: "settings.terminalDesc",
  },
  editor: {
    titleKey: "settings.editor",
    descKey: "settings.editorDesc",
  },
  hosts: {
    titleKey: "settings.remoteHosts",
    descKey: "settings.remoteHostsHint",
    wide: true,
  },
  shortcuts: {
    titleKey: "settings.shortcuts",
    descKey: "settings.shortcutsDesc",
  },
};

function ShortcutRow({ label, shortcut }: ShortcutEntry) {
  return (
    <div className={styles.shortcutRow}>
      <span className={styles.shortcutLabel}>{label}</span>
      <kbd className={styles.shortcutKey}>{shortcut}</kbd>
    </div>
  );
}

export function SettingsView() {
  const { t } = useTranslation();
  const {
    settings,
    loadSettings,
    updateSettings,
    addToast,
    setLanguage,
    language,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

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

  const hostLabels = useMemo(
    () => ({
      label: t("settings.label"),
      host: t("settings.host"),
      port: t("settings.port"),
      username: t("settings.username"),
      password: t("settings.password"),
      keyPath: t("settings.keyPath"),
      authPassword: t("settings.authTypePassword"),
      authPrivateKey: t("settings.authTypePrivateKey"),
      authType: t("settings.authType"),
      addHost: t("settings.addHost"),
      remove: t("settings.remove"),
      addNewHost: t("settings.addNewHost"),
      savedHosts: t("settings.savedHosts"),
      authBadgePassword: t("settings.authBadgePassword"),
      authBadgeKey: t("settings.authBadgeKey"),
    }),
    [t],
  );

  const terminalLabels = useMemo(
    () => ({
      fontSize: t("settings.terminalFontSize"),
      scrollback: t("settings.terminalScrollback"),
      fontFamily: t("settings.terminalFontFamily"),
      cursorStyle: t("settings.terminalCursorStyle"),
      cursorBlock: t("settings.cursorBlock"),
      cursorUnderline: t("settings.cursorUnderline"),
      cursorBar: t("settings.cursorBar"),
      windowsShell: t("settings.windowsShell"),
      save: t("settings.saveTerminal"),
    }),
    [t],
  );

  const editorLabels = useMemo(
    () => ({
      fontSize: t("settings.editorFontSize"),
      tabSize: t("settings.editorTabSize"),
      wordWrap: t("settings.editorWordWrap"),
      minimap: t("settings.editorMinimap"),
      save: t("settings.saveEditor"),
    }),
    [t],
  );

  const shortcuts = useMemo<ShortcutEntry[]>(
    () => [
      { label: t("settings.commandPalette"), shortcut: `${modKey}\u21E7P` },
      { label: t("settings.title"), shortcut: `${modKey},` },
      {
        label: t("settings.shortcutToggleInspector"),
        shortcut: isDarwin ? "\u2318\u2325I" : "Ctrl+Alt+I",
      },
      { label: t("nav.home"), shortcut: `${modKey}1` },
      { label: t("nav.localShell"), shortcut: `${modKey}2` },
      { label: t("nav.settings"), shortcut: `${modKey},` },
    ],
    [t],
  );

  const navEntries = useMemo<NavEntry[]>(
    () => [
      { id: "appearance", label: t("settings.appearance"), Icon: PaletteIcon },
      { id: "terminal", label: t("settings.terminal"), Icon: TerminalIcon },
      { id: "editor", label: t("settings.editor"), Icon: FileTextIcon },
      { id: "hosts", label: t("settings.remoteHosts"), Icon: NetworkIcon },
      { id: "shortcuts", label: t("settings.shortcuts"), Icon: KeyboardIcon },
    ],
    [t],
  );

  const sectionMeta = SECTION_META[activeSection];

  if (!settings) {
    return <div className={styles.loading}>{t("ui.loading")}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      <div className={styles.body}>
        <nav className={styles.sidebar} aria-label="Settings sections">
          <div className={styles.sidebarHeading}>{t("settings.navGroup")}</div>
          {navEntries.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={
                id === activeSection ? styles.navItemActive : styles.navItem
              }
              onClick={() => setActiveSection(id)}
              aria-current={id === activeSection ? "page" : undefined}
            >
              <span className={styles.navIcon}>
                <Icon />
              </span>
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          <div
            className={
              sectionMeta.wide ? styles.contentInnerWide : styles.contentInner
            }
          >
            <header className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>{t(sectionMeta.titleKey)}</h1>
              <p className={styles.pageDescription}>{t(sectionMeta.descKey)}</p>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                className={styles.sectionFade}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {activeSection === "appearance" && (
                  <AppearanceSection
                    themeLabel={t("settings.theme")}
                    languageLabel={t("settings.language")}
                    theme={theme}
                    language={selectedLang}
                    onThemeChange={handleThemeChange}
                    onLanguageChange={handleLanguageChange}
                  />
                )}

                {activeSection === "terminal" && (
                  <TerminalSection
                    showWindowsShell={window.api.platform === "win32"}
                    labels={terminalLabels}
                    fontSize={termValues.fontSize}
                    scrollback={termValues.scrollback}
                    fontFamily={termValues.fontFamily}
                    cursorStyle={
                      termValues.cursorStyle as "block" | "underline" | "bar"
                    }
                    windowsShell={
                      termValues.windowsShell as "powershell" | "cmd" | "wsl"
                    }
                    onFontSizeChange={(v) => updateTermField("fontSize", v)}
                    onScrollbackChange={(v) => updateTermField("scrollback", v)}
                    onFontFamilyChange={(v) => updateTermField("fontFamily", v)}
                    onCursorStyleChange={(v) =>
                      updateTermField("cursorStyle", v)
                    }
                    onWindowsShellChange={(v) =>
                      updateTermField("windowsShell", v)
                    }
                    onSave={saveTerminal}
                  />
                )}

                {activeSection === "editor" && (
                  <EditorSection
                    labels={editorLabels}
                    fontSize={edValues.fontSize}
                    tabSize={edValues.tabSize}
                    wordWrap={edValues.wordWrap}
                    minimap={edValues.minimap}
                    onFontSizeChange={(v) => updateEdField("fontSize", v)}
                    onTabSizeChange={(v) => updateEdField("tabSize", v)}
                    onWordWrapChange={(v) => updateEdField("wordWrap", v)}
                    onMinimapChange={(v) => updateEdField("minimap", v)}
                    onSave={saveEditor}
                  />
                )}

                {activeSection === "hosts" && (
                  <HostsSection labels={hostLabels} hosts={settings.hosts} />
                )}

                {activeSection === "shortcuts" && (
                  <SettingsPanel>
                    <div className={styles.shortcutList}>
                      {shortcuts.map((item) => (
                        <ShortcutRow
                          key={item.label}
                          label={item.label}
                          shortcut={item.shortcut}
                        />
                      ))}
                    </div>
                  </SettingsPanel>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
