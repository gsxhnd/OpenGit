/**
 * Command palette — Cmd/Ctrl+Shift+P
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
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { removeSession, sessions, toggleInspector } = useAppStore()

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'home',
        label: t('commands.goToHome'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/')
          setIsOpen(false)
        },
      },
      {
        id: 'local-shell',
        label: t('commands.openLocalTerminal'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/local-terminal')
          setIsOpen(false)
        },
      },
      {
        id: 'settings',
        label: t('commands.openSettings'),
        category: t('commands.navigation'),
        action: () => {
          navigate('/settings')
          setIsOpen(false)
        },
        shortcut: '\u2318,',
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
          setIsOpen(false)
        },
      },
      {
        id: 'toggle-inspector',
        label: t('commands.toggleInspector'),
        category: t('commands.workbench'),
        action: () => {
          toggleInspector()
          setIsOpen(false)
        },
        shortcut: '⌃⌥I',
      },
    ],
    [navigate, removeSession, sessions, t, toggleInspector],
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
  }, [search, isOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setIsOpen((o) => !o)
        return
      }
      if (mod && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
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
  }, [isOpen, filtered, selectedIndex])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
