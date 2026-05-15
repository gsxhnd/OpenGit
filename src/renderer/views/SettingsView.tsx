import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import { useState, useEffect } from "react";
import type { HostProfile } from "@shared/types";
import type { Language } from "../i18n/translations";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import {
  ChevronLeftIcon,
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
import styles from "./SettingsView.module.scss";

export function SettingsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    settings,
    loadSettings,
    updateSettings,
    addToast,
    setLanguage,
    language,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState("appearance");
  const [theme, setTheme] = useState(settings?.theme || "Standard Dark");
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  const [termFontSize, setTermFontSize] = useState(
    settings?.terminal.fontSize ?? 14,
  );
  const [termScrollback, setTermScrollback] = useState(
    settings?.terminal.scrollback ?? 5000,
  );
  const [termFontFamily, setTermFontFamily] = useState(
    settings?.terminal.fontFamily ?? 'Menlo, Monaco, "Courier New", monospace',
  );
  const [termCursorStyle, setTermCursorStyle] = useState(
    settings?.terminal.cursorStyle ?? "block",
  );
  const [termWindowsShell, setTermWindowsShell] = useState(
    settings?.terminal.windowsShell ?? "powershell",
  );

  const [edFontSize, setEdFontSize] = useState(settings?.editor.fontSize ?? 14);
  const [edTabSize, setEdTabSize] = useState(settings?.editor.tabSize ?? 2);
  const [edWordWrap, setEdWordWrap] = useState(
    settings?.editor.wordWrap === "on",
  );
  const [edMinimap, setEdMinimap] = useState(settings?.editor.minimap ?? true);

  const [newLabel, setNewLabel] = useState("");
  const [newHost, setNewHost] = useState("");
  const [newPort, setNewPort] = useState("22");
  const [newUser, setNewUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newKeyPath, setNewKeyPath] = useState("");
  const [authType, setAuthType] = useState<"password" | "privateKey">(
    "password",
  );
  const hostForm = {
    label: newLabel,
    host: newHost,
    port: newPort,
    username: newUser,
    password: newPassword,
    keyPath: newKeyPath,
    authType,
  };

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setTermFontSize(settings.terminal.fontSize);
      setTermScrollback(settings.terminal.scrollback);
      setTermFontFamily(settings.terminal.fontFamily);
      setTermCursorStyle(settings.terminal.cursorStyle);
      setTermWindowsShell(settings.terminal.windowsShell);
      setEdFontSize(settings.editor.fontSize);
      setEdTabSize(settings.editor.tabSize);
      setEdWordWrap(settings.editor.wordWrap === "on");
      setEdMinimap(settings.editor.minimap);
    }
  }, [settings]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (settings) {
      void updateSettings({ ...settings, theme: newTheme });
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLang(lang);
    void setLanguage(lang);
    addToast(t("settings.languageChanged"), "success");
  };

  const saveTerminal = () => {
    if (!settings) return;
    void updateSettings({
      ...settings,
      terminal: {
        fontSize: termFontSize,
        scrollback: termScrollback,
        fontFamily: termFontFamily,
        cursorStyle: termCursorStyle,
        windowsShell: termWindowsShell,
      },
    });
    addToast(t("settings.terminalSaved"), "success");
  };

  const saveEditor = () => {
    if (!settings) return;
    void updateSettings({
      ...settings,
      editor: {
        fontSize: edFontSize,
        tabSize: edTabSize,
        wordWrap: edWordWrap ? "on" : "off",
        minimap: edMinimap,
      },
    });
    addToast(t("settings.editorSaved"), "success");
  };

  const addHost = async () => {
    if (!newLabel.trim() || !newHost.trim() || !newUser.trim()) {
      addToast(t("settings.labelHostUsernameRequired"), "error");
      return;
    }
    const host: Omit<HostProfile, "id"> = {
      label: newLabel.trim(),
      host: newHost.trim(),
      port: Number(newPort) || 22,
      username: newUser.trim(),
      authType,
      password: authType === "password" ? newPassword || undefined : undefined,
      privateKeyPath:
        authType === "privateKey" ? newKeyPath || undefined : undefined,
    };
    try {
      await window.api.hostsAdd(host);
      setNewLabel("");
      setNewHost("");
      setNewUser("");
      setNewPassword("");
      setNewKeyPath("");
      await loadSettings();
      addToast(t("settings.hostSaved"), "success");
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t("err.saveFailed"), "error");
    }
  };

  const removeHost = async (id: string) => {
    await window.api.hostsRemove(id);
    await loadSettings();
    addToast(t("settings.hostRemoved"), "info");
  };

  const updateHostForm = (partial: Partial<typeof hostForm>) => {
    if (partial.label !== undefined) setNewLabel(partial.label);
    if (partial.host !== undefined) setNewHost(partial.host);
    if (partial.port !== undefined) setNewPort(partial.port);
    if (partial.username !== undefined) setNewUser(partial.username);
    if (partial.password !== undefined) setNewPassword(partial.password);
    if (partial.keyPath !== undefined) setNewKeyPath(partial.keyPath);
    if (partial.authType !== undefined) setAuthType(partial.authType);
  };

  if (!settings) {
    return <div className={styles.loading}>{t("ui.loading")}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      <div className={styles.header}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className={styles.backButton}
          data-icon="inline-start"
        >
          <ChevronLeftIcon className="size-4" />
          {t("ui.back")}
        </Button>
        <h1 className={styles.headerTitle}>{t("settings.title")}</h1>
      </div>

      <div className={styles.content}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-2xl"
        >
          <div className="mb-6">
            <TabsList className="w-auto overflow-x-auto">
              <TabsTrigger value="appearance" data-icon="inline-start">
                <PaletteIcon className="size-4" />
                {t("settings.appearance")}
              </TabsTrigger>
              <TabsTrigger value="terminal" data-icon="inline-start">
                <TerminalIcon className="size-4" />
                {t("settings.terminal")}
              </TabsTrigger>
              <TabsTrigger value="editor" data-icon="inline-start">
                <FileTextIcon className="size-4" />
                {t("settings.editor")}
              </TabsTrigger>
              <TabsTrigger value="hosts" data-icon="inline-start">
                <NetworkIcon className="size-4" />
                {t("settings.remoteHosts")}
              </TabsTrigger>
              <TabsTrigger value="shortcuts" data-icon="inline-start">
                <KeyboardIcon className="size-4" />
                {t("settings.shortcuts")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="appearance">
            <AppearanceSection
              title={t("settings.appearance")}
              themeLabel={t("settings.theme")}
              languageLabel={t("settings.language")}
              theme={theme}
              language={selectedLang}
              onThemeChange={handleThemeChange}
              onLanguageChange={handleLanguageChange}
            />
          </TabsContent>

          <TabsContent value="terminal">
            <TerminalSection
              showWindowsShell={window.api.platform === "win32"}
              labels={{
                title: t("settings.terminal"),
                fontSize: t("settings.terminalFontSize"),
                scrollback: t("settings.terminalScrollback"),
                fontFamily: t("settings.terminalFontFamily"),
                cursorStyle: t("settings.terminalCursorStyle"),
                cursorBlock: t("settings.cursorBlock"),
                cursorUnderline: t("settings.cursorUnderline"),
                cursorBar: t("settings.cursorBar"),
                windowsShell: t("settings.windowsShell"),
                save: t("settings.saveTerminal"),
              }}
              fontSize={termFontSize}
              scrollback={termScrollback}
              fontFamily={termFontFamily}
              cursorStyle={termCursorStyle}
              windowsShell={termWindowsShell}
              onFontSizeChange={setTermFontSize}
              onScrollbackChange={setTermScrollback}
              onFontFamilyChange={setTermFontFamily}
              onCursorStyleChange={setTermCursorStyle}
              onWindowsShellChange={setTermWindowsShell}
              onSave={saveTerminal}
            />
          </TabsContent>

          <TabsContent value="editor">
            <EditorSection
              labels={{
                title: t("settings.editor"),
                fontSize: t("settings.editorFontSize"),
                tabSize: t("settings.editorTabSize"),
                wordWrap: t("settings.editorWordWrap"),
                minimap: t("settings.editorMinimap"),
                save: t("settings.saveEditor"),
              }}
              fontSize={edFontSize}
              tabSize={edTabSize}
              wordWrap={edWordWrap}
              minimap={edMinimap}
              onFontSizeChange={setEdFontSize}
              onTabSizeChange={setEdTabSize}
              onWordWrapChange={setEdWordWrap}
              onMinimapChange={setEdMinimap}
              onSave={saveEditor}
            />
          </TabsContent>

          <TabsContent value="hosts">
            <HostsSection
              labels={{
                title: t("settings.remoteHosts"),
                hint: t("settings.remoteHostsHint"),
                label: t("settings.label"),
                host: t("settings.host"),
                port: t("settings.port"),
                username: t("settings.username"),
                password: t("settings.password"),
                keyPath: t("settings.keyPath"),
                authPassword: t("settings.authTypePassword"),
                authPrivateKey: t("settings.authTypePrivateKey"),
                addHost: t("settings.addHost"),
                remove: t("settings.remove"),
              }}
              hosts={settings.hosts}
              form={hostForm}
              onFormChange={updateHostForm}
              onAdd={() => {
                void addHost();
              }}
              onRemove={(id) => {
                void removeHost(id);
              }}
            />
          </TabsContent>

          <TabsContent value="shortcuts">
            <div className="bg-card rounded-xl border border-foreground/10 p-6">
              <h2 className="text-lg font-semibold mb-6">
                {t("settings.shortcuts")}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm">
                    {t("settings.commandPalette")}
                  </span>
                  <kbd className="px-3 py-1.5 text-xs font-semibold bg-muted rounded-lg">
                    ⌘⇧P
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm">{t("settings.title")}</span>
                  <kbd className="px-3 py-1.5 text-xs font-semibold bg-muted rounded-lg">
                    ⌘,
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm">
                    {t("settings.shortcutToggleInspector")}
                  </span>
                  <kbd className="px-3 py-1.5 text-xs font-semibold bg-muted rounded-lg">
                    {window.api.platform === "darwin" ? "⌘⌥I" : "Ctrl+Alt+I"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm">{t("nav.home")}</span>
                  <kbd className="px-3 py-1.5 text-xs font-semibold bg-muted rounded-lg">
                    ⌘1
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm">{t("nav.localShell")}</span>
                  <kbd className="px-3 py-1.5 text-xs font-semibold bg-muted rounded-lg">
                    ⌘2
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm">{t("nav.settings")}</span>
                  <kbd className="px-3 py-1.5 text-xs font-semibold bg-muted rounded-lg">
                    {window.api.platform === "darwin" ? "⌘," : "Ctrl+,"}
                  </kbd>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
