import { useEffect } from 'react'
import { useAppStore } from '../store'

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
  const {
    currentView,
    setView,
    goBack,
    stageAll,
    unstageAll,
    doCommit,
    repoStatus,
    loadHistory,
    loadGraph,
  } = useAppStore()

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: '1',
      ctrl: true,
      action: () => setView('commit'),
    },
    {
      key: '2',
      ctrl: true,
      action: () => setView('history'),
    },
    {
      key: '3',
      ctrl: true,
      action: () => setView('branches'),
    },
    {
      key: '4',
      ctrl: true,
      action: () => setView('graph'),
    },
    {
      key: 'Escape',
      action: () => {
        if (currentView !== 'commit' && currentView !== 'welcome') {
          goBack()
        }
      },
    },

    // Staging
    {
      key: 'a',
      ctrl: true,
      shift: true,
      action: () => stageAll(),
    },
    {
      key: 'u',
      ctrl: true,
      shift: true,
      action: () => unstageAll(),
    },

    // Commit
    {
      key: 'Enter',
      ctrl: true,
      action: () => {
        if (currentView === 'commit' && repoStatus?.status.stagedFiles.length) {
          // This will be handled by the CommitView component
        }
      },
    },
  ]

  useKeyboardShortcuts(shortcuts)
}
