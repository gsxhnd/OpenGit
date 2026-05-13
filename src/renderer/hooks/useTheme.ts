import { useEffect } from 'react'
import { useAppStore } from '../store'

export type ThemeName =
  | 'Standard Dark'
  | 'Standard Light'
  | 'Nord'
  | 'Catppuccin Mocha'
  | 'Catppuccin Latte'
  | 'Tokyo Night'
  | 'Dracula'

interface ThemeTokens {
  dark: boolean
  background: string
  foreground: string
  border: string
  ring: string
  accent: string
  accentForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  destructive: string
  destructiveForeground: string
  success: string
  warning: string
  info: string
  popover: string
  popoverForeground: string
  card: string
  cardForeground: string
  inputBorder: string
  scrollbar: string
  scrollbarThumb: string
  titleBar: string
  statusBar: string
  sidebar: string
  diffAdded: string
  diffDeleted: string
  diffAddedBg: string
  diffDeletedBg: string
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  'Standard Dark': {
    dark: true,
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    border: '#313244',
    ring: '#89b4fa',
    accent: '#89b4fa',
    accentForeground: '#1e1e2e',
    primary: '#89b4fa',
    primaryForeground: '#1e1e2e',
    secondary: '#313244',
    secondaryForeground: '#cdd6f4',
    muted: '#181825',
    mutedForeground: '#6c7086',
    destructive: '#f38ba8',
    destructiveForeground: '#1e1e2e',
    success: '#a6e3a1',
    warning: '#f9e2af',
    info: '#89dceb',
    popover: '#181825',
    popoverForeground: '#cdd6f4',
    card: '#181825',
    cardForeground: '#cdd6f4',
    inputBorder: '#45475a',
    scrollbar: '#313244',
    scrollbarThumb: '#45475a',
    titleBar: '#11111b',
    statusBar: '#11111b',
    sidebar: '#181825',
    diffAdded: '#a6e3a1',
    diffDeleted: '#f38ba8',
    diffAddedBg: 'rgba(166, 227, 161, 0.1)',
    diffDeletedBg: 'rgba(243, 139, 168, 0.1)',
  },

  'Standard Light': {
    dark: false,
    background: '#ffffff',
    foreground: '#1e1e2e',
    border: '#e2e8f0',
    ring: '#3b82f6',
    accent: '#3b82f6',
    accentForeground: '#ffffff',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#1e293b',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#0ea5e9',
    popover: '#ffffff',
    popoverForeground: '#1e1e2e',
    card: '#f8fafc',
    cardForeground: '#1e1e2e',
    inputBorder: '#cbd5e1',
    scrollbar: '#e2e8f0',
    scrollbarThumb: '#94a3b8',
    titleBar: '#f1f5f9',
    statusBar: '#f1f5f9',
    sidebar: '#f8fafc',
    diffAdded: '#16a34a',
    diffDeleted: '#dc2626',
    diffAddedBg: 'rgba(22, 163, 74, 0.1)',
    diffDeletedBg: 'rgba(220, 38, 38, 0.1)',
  },

  'Nord': {
    dark: true,
    background: '#2e3440',
    foreground: '#eceff4',
    border: '#3b4252',
    ring: '#88c0d0',
    accent: '#88c0d0',
    accentForeground: '#2e3440',
    primary: '#88c0d0',
    primaryForeground: '#2e3440',
    secondary: '#3b4252',
    secondaryForeground: '#eceff4',
    muted: '#242933',
    mutedForeground: '#4c566a',
    destructive: '#bf616a',
    destructiveForeground: '#eceff4',
    success: '#a3be8c',
    warning: '#ebcb8b',
    info: '#81a1c1',
    popover: '#242933',
    popoverForeground: '#eceff4',
    card: '#242933',
    cardForeground: '#eceff4',
    inputBorder: '#434c5e',
    scrollbar: '#3b4252',
    scrollbarThumb: '#434c5e',
    titleBar: '#242933',
    statusBar: '#242933',
    sidebar: '#242933',
    diffAdded: '#a3be8c',
    diffDeleted: '#bf616a',
    diffAddedBg: 'rgba(163, 190, 140, 0.1)',
    diffDeletedBg: 'rgba(191, 97, 106, 0.1)',
  },

  'Catppuccin Mocha': {
    dark: true,
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    border: '#313244',
    ring: '#cba6f7',
    accent: '#cba6f7',
    accentForeground: '#1e1e2e',
    primary: '#cba6f7',
    primaryForeground: '#1e1e2e',
    secondary: '#313244',
    secondaryForeground: '#cdd6f4',
    muted: '#181825',
    mutedForeground: '#6c7086',
    destructive: '#f38ba8',
    destructiveForeground: '#1e1e2e',
    success: '#a6e3a1',
    warning: '#f9e2af',
    info: '#89dceb',
    popover: '#181825',
    popoverForeground: '#cdd6f4',
    card: '#181825',
    cardForeground: '#cdd6f4',
    inputBorder: '#45475a',
    scrollbar: '#313244',
    scrollbarThumb: '#45475a',
    titleBar: '#11111b',
    statusBar: '#11111b',
    sidebar: '#181825',
    diffAdded: '#a6e3a1',
    diffDeleted: '#f38ba8',
    diffAddedBg: 'rgba(166, 227, 161, 0.1)',
    diffDeletedBg: 'rgba(243, 139, 168, 0.1)',
  },

  'Catppuccin Latte': {
    dark: false,
    background: '#eff1f5',
    foreground: '#4c4f69',
    border: '#ccd0da',
    ring: '#7287fd',
    accent: '#7287fd',
    accentForeground: '#eff1f5',
    primary: '#7287fd',
    primaryForeground: '#eff1f5',
    secondary: '#e6e9ef',
    secondaryForeground: '#4c4f69',
    muted: '#dce0e8',
    mutedForeground: '#8c8fa1',
    destructive: '#d20f39',
    destructiveForeground: '#eff1f5',
    success: '#40a02b',
    warning: '#df8e1d',
    info: '#04a5e5',
    popover: '#dce0e8',
    popoverForeground: '#4c4f69',
    card: '#dce0e8',
    cardForeground: '#4c4f69',
    inputBorder: '#bcc0cc',
    scrollbar: '#ccd0da',
    scrollbarThumb: '#acb0be',
    titleBar: '#ccd0da',
    statusBar: '#ccd0da',
    sidebar: '#dce0e8',
    diffAdded: '#40a02b',
    diffDeleted: '#d20f39',
    diffAddedBg: 'rgba(64, 160, 43, 0.1)',
    diffDeletedBg: 'rgba(210, 15, 57, 0.1)',
  },

  'Tokyo Night': {
    dark: true,
    background: '#1a1b26',
    foreground: '#c0caf5',
    border: '#292e42',
    ring: '#7aa2f7',
    accent: '#7aa2f7',
    accentForeground: '#1a1b26',
    primary: '#7aa2f7',
    primaryForeground: '#1a1b26',
    secondary: '#292e42',
    secondaryForeground: '#c0caf5',
    muted: '#24283b',
    mutedForeground: '#565f89',
    destructive: '#f7768e',
    destructiveForeground: '#1a1b26',
    success: '#9ece6a',
    warning: '#e0af68',
    info: '#7dcfff',
    popover: '#1f2335',
    popoverForeground: '#c0caf5',
    card: '#1f2335',
    cardForeground: '#c0caf5',
    inputBorder: '#3b4261',
    scrollbar: '#292e42',
    scrollbarThumb: '#3b4261',
    titleBar: '#16161e',
    statusBar: '#16161e',
    sidebar: '#1f2335',
    diffAdded: '#9ece6a',
    diffDeleted: '#f7768e',
    diffAddedBg: 'rgba(158, 206, 106, 0.1)',
    diffDeletedBg: 'rgba(247, 118, 142, 0.1)',
  },

  'Dracula': {
    dark: true,
    background: '#282a36',
    foreground: '#f8f8f2',
    border: '#44475a',
    ring: '#ff79c6',
    accent: '#ff79c6',
    accentForeground: '#282a36',
    primary: '#ff79c6',
    primaryForeground: '#282a36',
    secondary: '#44475a',
    secondaryForeground: '#f8f8f2',
    muted: '#21222c',
    mutedForeground: '#6272a4',
    destructive: '#ff5555',
    destructiveForeground: '#f8f8f2',
    success: '#50fa7b',
    warning: '#ffb86c',
    info: '#8be9fd',
    popover: '#21222c',
    popoverForeground: '#f8f8f2',
    card: '#21222c',
    cardForeground: '#f8f8f2',
    inputBorder: '#6272a4',
    scrollbar: '#44475a',
    scrollbarThumb: '#6272a4',
    titleBar: '#191a21',
    statusBar: '#191a21',
    sidebar: '#21222c',
    diffAdded: '#50fa7b',
    diffDeleted: '#ff5555',
    diffAddedBg: 'rgba(80, 250, 123, 0.1)',
    diffDeletedBg: 'rgba(255, 85, 85, 0.1)',
  },
}

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]

function applyTheme(tokens: ThemeTokens): void {
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
  root.style.setProperty('--color-scrollbar', tokens.scrollbar)
  root.style.setProperty('--color-scrollbar-thumb', tokens.scrollbarThumb)
  root.style.setProperty('--color-title-bar', tokens.titleBar)
  root.style.setProperty('--color-status-bar', tokens.statusBar)
  root.style.setProperty('--color-sidebar', tokens.sidebar)
  root.style.setProperty('--color-diff-added', tokens.diffAdded)
  root.style.setProperty('--color-diff-deleted', tokens.diffDeleted)
  root.style.setProperty('--color-diff-added-bg', tokens.diffAddedBg)
  root.style.setProperty('--color-diff-deleted-bg', tokens.diffDeletedBg)

  root.classList.toggle('dark', tokens.dark)
}

export function useTheme() {
  const { settings } = useAppStore()

  useEffect(() => {
    const themeName = (settings?.theme ?? 'Standard Dark') as ThemeName
    const tokens = THEMES[themeName] ?? THEMES['Standard Dark']
    applyTheme(tokens)
  }, [settings?.theme])
}
