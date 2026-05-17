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

  root.style.setProperty('--color-background', tokens.background)
  root.style.setProperty('--color-foreground', tokens.foreground)
  root.style.setProperty('--color-border', tokens.border)
  root.style.setProperty('--color-ring', tokens.ring)
  root.style.setProperty('--color-accent', tokens.accent)
  root.style.setProperty('--color-accent-foreground', tokens.accentForeground)
  root.style.setProperty('--color-primary', tokens.primary)
  root.style.setProperty('--color-primary-foreground', tokens.primaryForeground)
  root.style.setProperty('--color-secondary', tokens.secondary)
  root.style.setProperty('--color-secondary-foreground', tokens.secondaryForeground)
  root.style.setProperty('--color-muted', tokens.muted)
  root.style.setProperty('--color-muted-foreground', tokens.mutedForeground)
  root.style.setProperty('--color-destructive', tokens.destructive)
  root.style.setProperty('--color-destructive-foreground', tokens.destructiveForeground)
  root.style.setProperty('--color-success', tokens.success)
  root.style.setProperty('--color-warning', tokens.warning)
  root.style.setProperty('--color-info', tokens.info)
  root.style.setProperty('--color-popover', tokens.popover)
  root.style.setProperty('--color-popover-foreground', tokens.popoverForeground)
  root.style.setProperty('--color-card', tokens.card)
  root.style.setProperty('--color-card-foreground', tokens.cardForeground)
  root.style.setProperty('--color-input-border', tokens.inputBorder)
  root.style.setProperty('--color-input', tokens.inputBorder)
  root.style.setProperty('--color-scrollbar', tokens.scrollbar)
  root.style.setProperty('--color-scrollbar-thumb', tokens.scrollbarThumb)
  root.style.setProperty('--color-sidebar', tokens.sidebar)
  root.style.setProperty('--color-sidebar-foreground', tokens.sidebarForeground)
  root.style.setProperty('--color-sidebar-primary', tokens.sidebarPrimary)
  root.style.setProperty('--color-sidebar-primary-foreground', tokens.sidebarPrimaryForeground)
  root.style.setProperty('--color-sidebar-accent', tokens.sidebarAccent)
  root.style.setProperty('--color-sidebar-accent-foreground', tokens.sidebarAccentForeground)
  root.style.setProperty('--color-sidebar-border', tokens.sidebarBorder)
  root.style.setProperty('--color-sidebar-ring', tokens.sidebarRing)
  root.style.setProperty('--color-diff-added', tokens.diffAdded)
  root.style.setProperty('--color-diff-deleted', tokens.diffDeleted)
  root.style.setProperty('--color-diff-added-bg', tokens.diffAddedBg)
  root.style.setProperty('--color-diff-deleted-bg', tokens.diffDeletedBg)

  applyShellTokens(root, tokens)

  root.classList.toggle('dark', tokens.dark)
  root.dataset.themeAppearance = tokens.dark ? 'dark' : 'light'
}
