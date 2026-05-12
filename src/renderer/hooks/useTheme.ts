import { useEffect } from 'react'
import { useAppStore } from '../store'

export const THEMES = {
  'Tokyo Night': {
    primary: '#7aa2f7',
    secondary: '#414868',
    background: '#1a1b26',
    foreground: '#c0caf5',
    muted: '#565f89',
  },
  'Dracula': {
    primary: '#ff79c6',
    secondary: '#44475a',
    background: '#282a36',
    foreground: '#f8f8f2',
    muted: '#6272a4',
  },
  'Nord': {
    primary: '#88c0d0',
    secondary: '#3b4252',
    background: '#2e3440',
    foreground: '#eceff4',
    muted: '#4c566a',
  },
  'Solarized Dark': {
    primary: '#268bd2',
    secondary: '#073642',
    background: '#002b36',
    foreground: '#839496',
    muted: '#586e75',
  },
  'Solarized Light': {
    primary: '#268bd2',
    secondary: '#eee8d5',
    background: '#fdf6e3',
    foreground: '#657b83',
    muted: '#93a1a1',
  },
}

export function useTheme() {
  const { settings } = useAppStore()

  useEffect(() => {
    const themeName = settings?.theme || 'Tokyo Night'
    const theme = THEMES[themeName as keyof typeof THEMES] || THEMES['Tokyo Night']

    // Apply theme to CSS variables
    const root = document.documentElement
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--secondary', theme.secondary)
    root.style.setProperty('--background', theme.background)
    root.style.setProperty('--foreground', theme.foreground)
    root.style.setProperty('--muted', theme.muted)

    // Apply to document class for Tailwind
    document.documentElement.classList.toggle('dark', true)
  }, [settings?.theme])
}
