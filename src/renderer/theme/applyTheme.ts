import type { ThemeTokens } from './types'
import {
  deriveShellHeaderBackground,
  deriveShellHeaderForeground,
} from './shell-chrome'

/** Derived shell tokens so command palette / workbench chrome follow every theme */
function applyShellTokens(root: HTMLElement, tokens: ThemeTokens): void {
  const shellHeader = deriveShellHeaderBackground(tokens)
  const shellHeaderForeground = deriveShellHeaderForeground(tokens)

  root.style.setProperty('--color-shell-header', shellHeader)
  root.style.setProperty('--color-shell-header-foreground', shellHeaderForeground)
  root.style.setProperty('--color-title-bar', shellHeader)
  root.style.setProperty('--color-status-bar', shellHeader)
  root.style.setProperty('--color-widget', tokens.popover)
  root.style.setProperty('--color-widget-border', tokens.border)
  root.style.setProperty('--color-list-hover', tokens.sidebarAccent)
  root.style.setProperty('--color-list-active', tokens.sidebarPrimary)
  root.style.setProperty('--color-list-active-foreground', tokens.sidebarPrimaryForeground)
  root.style.setProperty(
    '--color-keybinding-bg',
    tokens.dark ? tokens.secondary : tokens.muted,
  )
  root.style.setProperty('--color-keybinding-border', tokens.inputBorder)
}

export function applyTheme(tokens: ThemeTokens): void {
  const root = document.documentElement

  root.style.setProperty('--background', tokens.background)
  root.style.setProperty('--foreground', tokens.foreground)
  root.style.setProperty('--border', tokens.border)
  root.style.setProperty('--ring', tokens.ring)
  root.style.setProperty('--accent', tokens.accent)
  root.style.setProperty('--accent-foreground', tokens.accentForeground)
  root.style.setProperty('--primary', tokens.primary)
  root.style.setProperty('--primary-foreground', tokens.primaryForeground)
  root.style.setProperty('--secondary', tokens.secondary)
  root.style.setProperty('--secondary-foreground', tokens.secondaryForeground)
  root.style.setProperty('--muted', tokens.muted)
  root.style.setProperty('--muted-foreground', tokens.mutedForeground)
  root.style.setProperty('--destructive', tokens.destructive)
  root.style.setProperty('--destructive-foreground', tokens.destructiveForeground)
  root.style.setProperty('--popover', tokens.popover)
  root.style.setProperty('--popover-foreground', tokens.popoverForeground)
  root.style.setProperty('--card', tokens.card)
  root.style.setProperty('--card-foreground', tokens.cardForeground)
  root.style.setProperty('--input', tokens.inputBorder)
  root.style.setProperty('--color-input-border', tokens.inputBorder)
  root.style.setProperty('--color-scrollbar', tokens.scrollbar)
  root.style.setProperty('--color-scrollbar-thumb', tokens.scrollbarThumb)
  root.style.setProperty('--sidebar', tokens.sidebar)
  root.style.setProperty('--sidebar-foreground', tokens.sidebarForeground)
  root.style.setProperty('--sidebar-primary', tokens.sidebarPrimary)
  root.style.setProperty('--sidebar-primary-foreground', tokens.sidebarPrimaryForeground)
  root.style.setProperty('--sidebar-accent', tokens.sidebarAccent)
  root.style.setProperty('--sidebar-accent-foreground', tokens.sidebarAccentForeground)
  root.style.setProperty('--sidebar-border', tokens.sidebarBorder)
  root.style.setProperty('--sidebar-ring', tokens.sidebarRing)
  root.style.setProperty('--color-diff-added', tokens.diffAdded)
  root.style.setProperty('--color-diff-deleted', tokens.diffDeleted)
  root.style.setProperty('--color-diff-added-bg', tokens.diffAddedBg)
  root.style.setProperty('--color-diff-deleted-bg', tokens.diffDeletedBg)

  applyShellTokens(root, tokens)

  root.classList.toggle('dark', tokens.dark)
  root.dataset.themeAppearance = tokens.dark ? 'dark' : 'light'
}
