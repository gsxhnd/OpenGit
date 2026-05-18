/**
 * AppMenubar — Win/Linux only custom menu bar using shadcn Menubar.
 * Not rendered on macOS (system menu bar handles this).
 */
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from "@renderer/components/ui/menubar";
import { useAppStore } from "@renderer/store";

interface AppMenubarProps {
  /** Render inside logo popover instead of inline in the header strip */
  embedded?: boolean;
  /** Called after a menu action (e.g. to close the logo popover) */
  onAction?: () => void;
}

export function AppMenubar({ embedded = false, onAction }: AppMenubarProps) {
  const { t } = useTranslation();
  const { toggleSecondPanel, toggleCommandPalette, setSettingsOpen } =
    useAppStore(
      useShallow((s) => ({
        toggleSecondPanel: s.toggleSecondPanel,
        toggleCommandPalette: s.toggleCommandPalette,
        setSettingsOpen: s.setSettingsOpen,
      })),
    );

  const run = (action: () => void) => () => {
    action();
    onAction?.();
  };

  const handleQuit = run(() => window.api.close());
  const handleFullscreen = run(() => {
    (window.api as { toggleFullscreen?: () => void }).toggleFullscreen?.();
  });

  const menubarClass = embedded
    ? "h-auto min-h-0 border-0 rounded-none bg-transparent p-0 gap-0"
    : "h-[var(--shell-header-height)] max-h-[var(--shell-header-height)] min-h-0 border-0 rounded-none bg-transparent p-0 gap-0";

  const triggerClass = embedded
    ? "h-8 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-xs px-2 py-0"
    : "h-[var(--shell-header-height)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-xs px-2 py-0";

  return (
    <Menubar className={menubarClass}>
      {/* File */}
      <MenubarMenu>
        <MenubarTrigger className={triggerClass}>
          {t("menu.file")}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={run(() => {
              window.location.hash = "#/connections";
            })}
          >
            {t("menu.newConnection")}
          </MenubarItem>
          <MenubarItem
            onClick={run(() => {
              window.location.hash = "#/local-terminal";
            })}
          >
            {t("menu.newLocalTerminal")}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={run(() => setSettingsOpen(true))}>
            {t("nav.settings")}
            <MenubarShortcut>Ctrl+,</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleQuit} variant="destructive">
            {t("menu.quit")}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Edit */}
      <MenubarMenu>
        <MenubarTrigger className={triggerClass}>
          {t("menu.edit")}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={run(() => document.execCommand("copy"))}>
            {t("menu.copy")}
            <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={run(() => document.execCommand("paste"))}>
            {t("menu.paste")}
            <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={run(() => document.execCommand("selectAll"))}>
            {t("menu.selectAll")}
            <MenubarShortcut>Ctrl+A</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* View */}
      <MenubarMenu>
        <MenubarTrigger className={triggerClass}>
          {t("menu.view")}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={run(toggleSecondPanel)}>
            {t("menu.toggleSecondPanel")}
            <MenubarShortcut>Ctrl+Alt+I</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={run(toggleCommandPalette)}>
            {t("menu.commandPalette")}
            <MenubarShortcut>Ctrl+Shift+P</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleFullscreen}>
            {t("menu.toggleFullscreen")}
            <MenubarShortcut>F11</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Help */}
      <MenubarMenu>
        <MenubarTrigger className={triggerClass}>
          {t("menu.help")}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={run(() => {
              (window.api as { showAbout?: () => void }).showAbout?.();
            })}
          >
            {t("menu.about")}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
