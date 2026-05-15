import { useEffect } from 'react'
import { useAppStore } from '../store'
import type { ThemeName } from '../theme/types'
import { THEMES } from '../theme/presets'
import { applyTheme } from '../theme/applyTheme'

export type { ThemeName } from '../theme/types'
export { THEMES, THEME_NAMES } from '../theme/presets'

export function useTheme() {
  const settings = useAppStore((s) => s.settings)

  useEffect(() => {
    const themeName = (settings?.theme ?? 'Standard Dark') as ThemeName
    const tokens = THEMES[themeName] ?? THEMES['Standard Dark']
    applyTheme(tokens)
  }, [settings?.theme])
}
