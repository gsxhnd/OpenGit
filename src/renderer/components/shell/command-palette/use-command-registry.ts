import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store'
import { useSidebar } from '../../ui/sidebar'
import type { PaletteCommand } from './types'

function formatKeybinding(keys: string): string {
  if (window.api.platform !== 'darwin') return keys
  return keys
    .replace(/Ctrl/g, '⌘')
    .replace(/Alt/g, '⌥')
    .replace(/Shift/g, '⇧')
}

export function useCommandRegistry(onClose: () => void): PaletteCommand[] {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { removeSession, sessions, toggleInspector } = useAppStore(useShallow((s) => ({ removeSession: s.removeSession, sessions: s.sessions, toggleInspector: s.toggleInspector })))
  const { toggleSidebar } = useSidebar()

  return useMemo(() => {
    const close = onClose
    const go = (path: string) => {
      navigate(path)
      close()
    }

    return [
      {
        id: 'workbench.action.goHome',
        label: t('commands.goToHome'),
        action: () => go('/'),
        keybinding: formatKeybinding('Ctrl+1'),
      },
      {
        id: 'workbench.action.openLocalTerminal',
        label: t('commands.openLocalTerminal'),
        action: () => go('/local-terminal'),
        keybinding: formatKeybinding('Ctrl+2'),
      },
      {
        id: 'workbench.action.openConnections',
        label: t('commands.goToConnections'),
        action: () => go('/connections'),
      },
      {
        id: 'workbench.action.openFiles',
        label: t('commands.openFiles'),
        action: () => go('/files'),
      },
      {
        id: 'workbench.action.openSettings',
        label: t('commands.openSettings'),
        action: () => go('/settings'),
        keybinding: formatKeybinding('Ctrl+,'),
      },
      {
        id: 'workbench.action.toggleSidebarVisibility',
        label: t('commands.toggleSidebar'),
        action: () => {
          toggleSidebar()
          close()
        },
        keybinding: formatKeybinding('Ctrl+B'),
      },
      {
        id: 'workbench.action.toggleInspector',
        label: t('commands.toggleInspector'),
        description: t('workbench.inspectorToggleHint'),
        action: () => {
          toggleInspector()
          close()
        },
        keybinding: formatKeybinding('Ctrl+Alt+I'),
      },
      {
        id: 'workbench.action.clearRemoteSessions',
        label: t('commands.clearSession'),
        action: () => {
          for (const s of sessions) {
            void window.api.sshDisconnect(s.connectionId)
            removeSession(s.connectionId)
          }
          close()
        },
      },
    ]
  }, [navigate, onClose, removeSession, sessions, t, toggleInspector, toggleSidebar])
}
