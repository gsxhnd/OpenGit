import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = (shortcut.ctrl ?? false) === (e.ctrlKey || e.metaKey)
        const shiftMatches = (shortcut.shift ?? false) === e.shiftKey
        const altMatches = (shortcut.alt ?? false) === e.altKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          e.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export function useAppKeyboardShortcuts() {
  const navigate = useNavigate()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      ctrl: true,
      action: () => navigate('/'),
    },
    {
      key: '2',
      ctrl: true,
      action: () => navigate('/local-terminal'),
    },
    {
      key: '3',
      ctrl: true,
      action: () => navigate('/settings'),
    },
  ]

  useKeyboardShortcuts(shortcuts)
}
