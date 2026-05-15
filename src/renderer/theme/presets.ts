import type { ThemeName, ThemeTokens } from './types'
import {
  catppuccinLatte,
  catppuccinMocha,
  dracula,
  nord,
  standardDark,
  standardLight,
  tokyoNight,
} from './themes'

export const THEMES: Record<ThemeName, ThemeTokens> = {
  'Standard Dark': standardDark,
  'Standard Light': standardLight,
  Nord: nord,
  'Catppuccin Mocha': catppuccinMocha,
  'Catppuccin Latte': catppuccinLatte,
  'Tokyo Night': tokyoNight,
  Dracula: dracula,
}

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]
