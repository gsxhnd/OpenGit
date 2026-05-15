export type ThemeName =
  | 'Standard Dark'
  | 'Standard Light'
  | 'Nord'
  | 'Catppuccin Mocha'
  | 'Catppuccin Latte'
  | 'Tokyo Night'
  | 'Dracula'

export interface ThemeTokens {
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
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
  diffAdded: string
  diffDeleted: string
  diffAddedBg: string
  diffDeletedBg: string
}
