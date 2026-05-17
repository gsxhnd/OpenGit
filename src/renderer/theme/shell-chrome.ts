import type { ThemeTokens } from "./types";

/**
 * Unified top chrome strip (all panel headers, session tabs, status bar).
 * Dark: theme titleBar (darkest strip, Standard Dark pattern).
 * Light: sidebar surface so primary rail + headers align.
 */
export function deriveShellHeaderBackground(tokens: ThemeTokens): string {
  return tokens.dark ? tokens.titleBar : tokens.sidebar;
}

export function deriveShellHeaderForeground(tokens: ThemeTokens): string {
  return tokens.dark ? tokens.foreground : tokens.sidebarForeground;
}
