/**
 * Command palette — Cmd/Ctrl+Shift+P
 *
 * VSCode-style design:
 * - Positioned at top-center of the window
 * - No heavy backdrop — subtle shadow only
 * - Commands grouped by category with group headers
 * - Per-command icon, label, optional description, keybinding chip
 * - Fuzzy match highlights in the label
 * - Keyboard: ↑↓ navigate, Enter execute, Esc close
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard,
  TerminalSquare,
  Plug,
  Folder,
  Settings,
  PanelRight,
  PanelLeft,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '../../store'
import { useSidebar } from '../ui/sidebar'
import styles from './CommandPalette.module.scss'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Command {
  id: string
  label: string
  description?: string
  category: string
  icon?: LucideIcon
  action: () => void
  keybinding?: string
}

// ─── Highlight helper ────────────────────────────────────────────────────────

/** Returns an array of {text, highlight} segments for a label given a query. */
function highlightSegments(label: string, query: string): { text: string; highlight: boolean }[] {
  if (!query) return [{ text: label, highlight: false }]
  const lower = label.toLowerCase()
  const q = query.toLowerCase()
  const segments: { text: string; highlight: boolean }[] = []
  let cursor = 0
  let idx = lower.indexOf(q, cursor)
  while (idx !== -1) {
    if (idx > cursor) segments.push({ text: label.slice(cursor, idx), highlight: false })
    segments.push({ text: label.slice(idx, idx + q.length), highlight: true })
    cursor = idx + q.length
    idx = lower.indexOf(q, cursor)
  }
  if (cursor < label.length) segments.push({ text: label.slice(cursor), highlight: false })
  return segments
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CommandPalette() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    removeSession,
    sessions,
    toggleInspector,
  } = useAppStore()
  const { toggleSidebar } = useSidebar()

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Command registry ──────────────────────────────────────────────────────

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'home',
        label: t('commands.goToHome'),
        category: t('commands.navigation'),
        icon: LayoutDashboard,
        action: () => { navigate('/'); setCommandPaletteOpen(false) },
        keybinding: window.api.platform === 'darwin' ? '⌘1' : 'Ctrl+1',
      },
      {
        id: 'local-shell',
        label: t('commands.openLocalTerminal'),
        category: t('commands.navigation'),
        icon: TerminalSquare,
        action: () => { navigate('/local-terminal'); setCommandPaletteOpen(false) },
        keybinding: window.api.platform === 'darwin' ? '⌘2' : 'Ctrl+2',
      },
      {
        id: 'connections',
        label: t('commands.goToConnections'),
        category: t('commands.navigation'),
        icon: Plug,
        action: () => { navigate('/connections'); setCommandPaletteOpen(false) },
      },
      {
        id: 'files',
        label: t('commands.openFiles'),
        category: t('commands.navigation'),
        icon: Folder,
        action: () => { navigate('/files'); setCommandPaletteOpen(false) },
      },
      {
        id: 'settings',
        label: t('commands.openSettings'),
        category: t('commands.navigation'),
        icon: Settings,
        action: () => { navigate('/settings'); setCommandPaletteOpen(false) },
        keybinding: window.api.platform === 'darwin' ? '⌘,' : 'Ctrl+,',
      },
      {
        id: 'toggle-sidebar',
        label: t('commands.toggleSidebar'),
        category: t('commands.workbench'),
        icon: PanelLeft,
        action: () => { toggleSidebar(); setCommandPaletteOpen(false) },
        keybinding: window.api.platform === 'darwin' ? '⌘B' : 'Ctrl+B',
      },
      {
        id: 'toggle-inspector',
        label: t('commands.toggleInspector'),
        description: t('workbench.inspectorToggleHint'),
        category: t('commands.workbench'),
        icon: PanelRight,
        action: () => { toggleInspector(); setCommandPaletteOpen(false) },
        keybinding: window.api.platform === 'darwin' ? '⌘⌥I' : 'Ctrl+Alt+I',
      },
      {
        id: 'clear-sessions',
        label: t('commands.clearSession'),
        category: t('commands.session'),
        icon: Trash2,
        action: () => {
          for (const s of sessions) {
            void window.api.sshDisconnect(s.connectionId)
            removeSession(s.connectionId)
          }
          setCommandPaletteOpen(false)
        },
      },
    ],
    [navigate, removeSession, sessions, t, toggleInspector, toggleSidebar, setCommandPaletteOpen],
  )

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false),
    )
  }, [commands, search])

  // Group filtered commands by category
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>()
    for (const cmd of filtered) {
      const list = map.get(cmd.category) ?? []
      list.push(cmd)
      map.set(cmd.category, list)
    }
    return map
  }, [filtered])

  // ── Selection reset ───────────────────────────────────────────────────────

  useEffect(() => {
    setSelectedIndex(0)
  }, [search, commandPaletteOpen])

  // Auto-focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [commandPaletteOpen])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // ── Global shortcut ───────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        toggleCommandPalette()
      }
      if (mod && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, toggleCommandPalette])

  // ── In-palette keyboard navigation ───────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [filtered, selectedIndex, setCommandPaletteOpen],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  // Build a flat index → command map for selectedIndex tracking
  const flatCommands = filtered

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop — click to close */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={styles.backdrop}
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={styles.panel}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={t('commands.searchPlaceholder')}
          >
            {/* Search input */}
            <div className={styles.inputRow}>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder={t('commands.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-controls="command-list"
                aria-activedescendant={`cmd-item-${selectedIndex}`}
              />
            </div>

            {/* Results */}
            <ul
              id="command-list"
              ref={listRef}
              className={styles.list}
              role="listbox"
            >
              {filtered.length === 0 ? (
                <li className={styles.empty}>{t('ui.noResults')}</li>
              ) : (
                Array.from(groups.entries()).map(([category, cmds]) => (
                  <li key={category} role="presentation">
                    <div className={styles.groupHeader}>{category}</div>
                    <ul role="group" aria-label={category}>
                      {cmds.map((cmd) => {
                        const flatIdx = flatCommands.indexOf(cmd)
                        const isSelected = flatIdx === selectedIndex
                        const Icon = cmd.icon
                        const segments = highlightSegments(cmd.label, search.trim())
                        return (
                          <li
                            key={cmd.id}
                            id={`cmd-item-${flatIdx}`}
                            data-index={flatIdx}
                            role="option"
                            aria-selected={isSelected}
                            className={`${styles.item} ${isSelected ? styles.itemActive : ''}`}
                            onClick={() => cmd.action()}
                            onMouseEnter={() => setSelectedIndex(flatIdx)}
                          >
                            <span className={styles.itemIcon}>
                              {Icon ? <Icon size={15} /> : null}
                            </span>
                            <span className={styles.itemBody}>
                              <span className={styles.itemLabel}>
                                {segments.map((seg, i) =>
                                  seg.highlight
                                    ? <mark key={i} className={styles.highlight}>{seg.text}</mark>
                                    : <span key={i}>{seg.text}</span>
                                )}
                              </span>
                              {cmd.description && (
                                <span className={styles.itemDesc}>{cmd.description}</span>
                              )}
                            </span>
                            {cmd.keybinding && (
                              <span className={styles.keybinding}>{cmd.keybinding}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            {/* Footer hint bar */}
            <div className={styles.footer}>
              <span><kbd className={styles.kbd}>↑↓</kbd> {t('commands.navigation')}</span>
              <span><kbd className={styles.kbd}>↵</kbd> {t('env.select')}</span>
              <span><kbd className={styles.kbd}>Esc</kbd> {t('ui.close')}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
