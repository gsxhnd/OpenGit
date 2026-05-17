import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
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
import { useSettingsDraftState } from "../hooks/settings/useSettingsDraftState";
import { type SettingsSection, SECTION_META, isDarwin, modKey } from "../components/settings/constants";
import { SettingsNav, type NavEntry } from "../components/settings/SettingsNav";
import styles from "./SettingsView.module.scss";

interface ShortcutEntry {
  label: string;
  shortcut: string;
}

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
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

  const {
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
  } = useSettingsDraftState();

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
        <SettingsNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          navEntries={navEntries}
          heading={t("settings.navGroup")}
        />

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
