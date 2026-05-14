/**
 * Command palette — Cmd/Ctrl+Shift+P
 * Open state driven by Zustand store so TitleBar and shortcuts can toggle it.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../store'
import { Input } from '../ui/input'
import { Search } from 'lucide-react'
import styles from './CommandPalette.module.scss'

export interface Command {
  id: string
  label: string
  description?: string
  category: string
  action: () => void
  shortcut?: string
}

export function CommandPalette() {
  const { t } = useTranslation()
  const { commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette, removeSession, sessions, toggleInspector } = useAppStore()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'home',
        label: t('commands.goToHome'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/')
          setCommandPaletteOpen(false)
        },
      },
      {
        id: 'local-shell',
        label: t('commands.openLocalTerminal'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/local-terminal')
          setCommandPaletteOpen(false)
        },
      },
      {
        id: 'connections',
        label: t('commands.goToConnections'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/connections')
          setCommandPaletteOpen(false)
        },
      },
      {
        id: 'settings',
        label: t('commands.openSettings'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/settings')
          setCommandPaletteOpen(false)
        },
        shortcut: '\u2318,',
      },
      {
        id: 'files',
        label: t('commands.openFiles'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/files')
          setCommandPaletteOpen(false)
        },
      },
      {
        id: 'toggle-sidebar',
        label: t('commands.toggleSidebar'),
        category: t('commands.workbench'),
        action: () => {
          setCommandPaletteOpen(false)
        },
        shortcut: 'Ctrl+B',
      },
      {
        id: 'clear-sessions',
        label: t('commands.clearSession'),
        category: t('commands.session'),
        action: () => {
          for (const s of sessions) {
            void window.api.sshDisconnect(s.connectionId)
            removeSession(s.connectionId)
          }
          setCommandPaletteOpen(false)
        },
      },
      {
        id: 'toggle-inspector',
        label: t('commands.toggleInspector'),
        description: t('workbench.inspectorToggleHint'),
        category: t('commands.workbench'),
        action: () => {
          toggleInspector()
          setCommandPaletteOpen(false)
        },
        shortcut: 'Ctrl+I',
      },
    ],
    [navigate, removeSession, sessions, t, toggleInspector, setCommandPaletteOpen],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    )
  }, [commands, search])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search, commandPaletteOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        toggleCommandPalette()
        return
      }
      if (mod && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, toggleCommandPalette])

  useEffect(() => {
    if (!commandPaletteOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        filtered[selectedIndex].action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commandPaletteOpen, filtered, selectedIndex, setCommandPaletteOpen])

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={styles.overlay}
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className={styles.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.container}>
              <div className={styles.searchBar}>
                <Search className={styles.searchIcon} size={18} />
                <Input
                  autoFocus
                  placeholder={t('commands.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent shadow-none outline-none focus-visible:ring-0"
                />
              </div>
              {filtered.length === 0 ? (
                <div className={styles.emptyState}>{t('ui.noResults')}</div>
              ) : (
                <ul className={styles.commandList}>
                  {filtered.map((cmd, i) => (
                    <li key={cmd.id}>
                      <button
                        type="button"
                        className={`${styles.commandItem} ${i === selectedIndex ? styles.itemSelected : ''}`}
                        onClick={() => cmd.action()}
                        onMouseEnter={() => setSelectedIndex(i)}
                      >
                        <span className={styles.commandLabel}>{cmd.label}</span>
                        <span className={styles.commandMeta}>
                          <span className={styles.commandCategory}>{cmd.category}</span>
                          {cmd.shortcut && <span className={styles.commandShortcut}>{cmd.shortcut}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <footer className={styles.footer}>
                <span>↑↓ {t('commands.navigation')}</span>
                <span>↵ {t('env.select')}</span>
                <span>Esc {t('ui.close')}</span>
              </footer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
