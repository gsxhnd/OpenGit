import { SHELL_CHROME } from "@shared/shell-chrome";

export const platform = window.api.platform;
export const isDarwin = platform === "darwin";
export const isWin32 = platform === "win32";
export const isLinux = platform === "linux";
/** Windows or Linux — uses in-window chrome (menubar / win controls) */
export const isDesktopChrome = !isDarwin;

const chrome = isDarwin ? SHELL_CHROME.darwin : isWin32 ? SHELL_CHROME.win32 : SHELL_CHROME.linux;

export const shellHeaderHeight = chrome.headerHeight;
export const shellIconSize = chrome.iconSize;
export const shellControlSize = chrome.controlSize;
export const shellTrafficLightPadding =
  "trafficLightPadding" in chrome ? chrome.trafficLightPadding : 0;
export const shellWinControlWidth =
  "winControlWidth" in chrome ? chrome.winControlWidth : 46;

/** Tailwind classes for header action buttons (command palette, panel toggle, etc.) */
export const shellHeaderControlClass =
  shellControlSize === 28 ? "h-7 w-7" : "h-6 w-6";

/** Shell header icon button colors (import shell-header.module.scss `.control` for full styles). */
export const shellHeaderButtonClass =
  "text-[color-mix(in_oklab,var(--color-shell-header-foreground)_68%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-shell-header-foreground)_10%,transparent)] hover:text-[var(--color-shell-header-foreground)]";

export const shellHeaderButtonActiveClass =
  "bg-[color-mix(in_oklab,var(--color-shell-header-foreground)_12%,transparent)] text-[var(--color-shell-header-foreground)]";
