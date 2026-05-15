import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../store'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  /** If true, shortcut fires even when a terminal element is focused */
  allowInTerminal?: boolean
  action: () => void
}

/** Returns true when the keyboard event originates from inside an xterm.js canvas/textarea */
function isTerminalFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  // xterm renders into a .xterm-helper-textarea or canvas inside a .xterm element
  return el.closest('.xterm') !== null
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
          if (!shortcut.allowInTerminal && isTerminalFocused()) continue
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
  const toggleInspector = useAppStore((s) => s.toggleInspector)
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette)

  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: 'p',
        ctrl: true,
        shift: true,
        allowInTerminal: true,
        action: () => toggleCommandPalette(),
      },
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
        key: ',',
        ctrl: true,
        action: () => navigate('/settings'),
      },
      {
        key: 'i',
        ctrl: true,
        alt: true,
        action: () => toggleInspector(),
      },
    ],
    [navigate, toggleCommandPalette, toggleInspector],
  )

  useKeyboardShortcuts(shortcuts)
}
