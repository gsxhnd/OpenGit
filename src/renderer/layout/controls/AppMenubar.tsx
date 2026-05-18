/**
 * AppMenubar — Win/Linux app logo dropdown with application menu items.
 * Not rendered on macOS (system menu bar handles this).
 */
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import {
  PlugIcon,
  TerminalIcon,
  CopyIcon,
  ClipboardPasteIcon,
  TextSelectIcon,
  PanelRightIcon,
  SearchIcon,
  MaximizeIcon,
  InfoIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip";
import { useAppStore } from "@renderer/store";
import styles from "./AppMenubar.module.scss";

export function AppMenubar() {
  const { t } = useTranslation();
  const { toggleSecondPanel, toggleCommandPalette, setSettingsOpen } =
    useAppStore(
      useShallow((s) => ({
        toggleSecondPanel: s.toggleSecondPanel,
        toggleCommandPalette: s.toggleCommandPalette,
        setSettingsOpen: s.setSettingsOpen,
      })),
    );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              className={styles.trigger}
              aria-label={t("titleBar.menu")}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </DropdownMenuTrigger>
          }
        />
        <TooltipContent side="bottom">{t("titleBar.menu")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" side="bottom" sideOffset={4} className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("menu.file")}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              window.location.hash = "#/connections";
            }}
          >
            <PlugIcon />
            {t("menu.newConnection")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              window.location.hash = "#/local-terminal";
            }}
          >
            <TerminalIcon />
            {t("menu.newLocalTerminal")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
            {t("nav.settings")}
            <DropdownMenuShortcut>Ctrl+,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.api.close()} variant="destructive">
            <LogOutIcon />
            {t("menu.quit")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("menu.edit")}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => document.execCommand("copy")}>
            <CopyIcon />
            {t("menu.copy")}
            <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => document.execCommand("paste")}>
            <ClipboardPasteIcon />
            {t("menu.paste")}
            <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => document.execCommand("selectAll")}>
            <TextSelectIcon />
            {t("menu.selectAll")}
            <DropdownMenuShortcut>Ctrl+A</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("menu.view")}</DropdownMenuLabel>
          <DropdownMenuItem onClick={toggleSecondPanel}>
            <PanelRightIcon />
            {t("menu.toggleSecondPanel")}
            <DropdownMenuShortcut>Ctrl+Alt+I</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleCommandPalette}>
            <SearchIcon />
            {t("menu.commandPalette")}
            <DropdownMenuShortcut>Ctrl+Shift+P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              (window.api as { toggleFullscreen?: () => void }).toggleFullscreen?.();
            }}
          >
            <MaximizeIcon />
            {t("menu.toggleFullscreen")}
            <DropdownMenuShortcut>F11</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("menu.help")}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              (window.api as { showAbout?: () => void }).showAbout?.();
            }}
          >
            <InfoIcon />
            {t("menu.about")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
