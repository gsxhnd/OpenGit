/**
 * Command palette — Cmd/Ctrl+Shift+P
 *
 * Visual and interaction model aligned with VS Code quick input (command mode):
 * top-center panel, `>` input prefix, flat command list, fuzzy filter, keybindings on the right.
 */
import { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@renderer/store'
import { fuzzyMatch } from '@renderer/lib/fuzzy-filter'
import { cn } from '@renderer/lib/utils'
import { useCommandRegistry } from './use-command-registry'
import { useCommandRecents } from './use-command-recents'
import { useCommandCenterAnchor } from './use-command-center-anchor'
import type { ScoredPaletteCommand } from './types'
import styles from './CommandPalette.module.scss'

const MAX_VISIBLE = 12

function FuzzyHighlight({
  label,
  matches,
}: {
  label: string
  matches: readonly number[]
}) {
  if (matches.length === 0) return <>{label}</>
  const matchSet = new Set(matches)
  return (
    <>
      {label.split('').map((char, index) =>
        matchSet.has(index) ? (
          <span key={index} className={styles.match}>
            {char}
          </span>
        ) : (
          <span key={index}>{char}</span>
        ),
      )}
    </>
  )
}

function KeybindingLabel({ value }: { value: string }) {
  const keys = value.includes('+') ? value.split('+') : [value]
  return (
    <span className={styles.keybinding} aria-hidden>
      {keys.map((key, index) => (
        <span key={index} className={styles.keybindingPart}>
          {index > 0 ? <span className={styles.keybindingSep}>+</span> : null}
          <kbd className={styles.keybindingKey}>{key}</kbd>
        </span>
      ))}
    </span>
  )
}

function scoreCommands(
  commands: ReturnType<typeof useCommandRegistry>,
  query: string,
  recentRank: (id: string) => number,
): ScoredPaletteCommand[] {
  const q = query.trim()

  const scored = commands.map((command) => {
    const labelMatch = fuzzyMatch(q, command.label)
    const descMatch = command.description ? fuzzyMatch(q, command.description) : null

    if (q && !labelMatch && !descMatch) return null

    const rank = recentRank(command.id)
    const recentBoost = rank >= 0 ? rank * 15 : 0
    const baseScore = labelMatch?.score ?? descMatch?.score ?? 0

    return {
      command,
      score: baseScore + recentBoost,
      matches: labelMatch?.matches ?? [],
    }
  })

  const results = scored.filter((item): item is ScoredPaletteCommand => item !== null)

  if (!q) {
    return results.sort((a, b) => {
      const rankDiff = recentRank(b.command.id) - recentRank(a.command.id)
      if (rankDiff !== 0) return rankDiff
      return a.command.label.localeCompare(b.command.label)
    })
  }

  return results.sort((a, b) => b.score - a.score || a.command.label.localeCompare(b.command.label))
}

export function CommandPalette() {
  const { t } = useTranslation()
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore(useShallow((s) => ({ commandPaletteOpen: s.commandPaletteOpen, setCommandPaletteOpen: s.setCommandPaletteOpen })))
  const { recordRecent, recentRank } = useCommandRecents()

  const close = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen])
  const anchorRect = useCommandCenterAnchor(commandPaletteOpen)
  const commands = useCommandRegistry(close)

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => scoreCommands(commands, search, recentRank),
    [commands, search, recentRank],
  )

  const visible = filtered.slice(0, MAX_VISIBLE)
  const showRecentHeader = !search.trim() && visible.length > 0

  useEffect(() => {
    setSelectedIndex(0)
  }, [search, commandPaletteOpen])

  useEffect(() => {
    if (!commandPaletteOpen) return
    setSearch('')
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [commandPaletteOpen])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const runCommand = useCallback(
    (item: ScoredPaletteCommand) => {
      recordRecent(item.command.id)
      item.command.action()
    },
    [recordRecent],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, visible.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && visible[selectedIndex]) {
        e.preventDefault()
        runCommand(visible[selectedIndex])
      }
    },
    [close, runCommand, selectedIndex, visible],
  )

  if (typeof document === 'undefined') return null

  const panelStyle: CSSProperties | undefined = anchorRect
    ? {
        top: anchorRect.bottom - 1,
        left: anchorRect.left,
        width: anchorRect.width,
        transform: 'none',
      }
    : undefined

  return createPortal(
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.button
            key="backdrop"
            type="button"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className={styles.backdrop}
            aria-label={t('ui.close')}
            onClick={close}
          />

          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={cn(styles.panel, anchorRect && styles.panelAnchored)}
            style={panelStyle}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={t('commands.searchPlaceholder')}
          >
            <div className={styles.inputRow}>
              <span className={styles.inputPrefix} aria-hidden>
                &gt;
              </span>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder={t('commands.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-expanded
                aria-controls="command-palette-list"
                aria-activedescendant={
                  visible[selectedIndex] ? `cmd-item-${selectedIndex}` : undefined
                }
                aria-autocomplete="list"
              />
            </div>

            <div className={styles.listWrap}>
              {showRecentHeader ? (
                <div className={styles.listHeader}>{t('commands.recentlyUsed')}</div>
              ) : null}
              <div
                id="command-palette-list"
                ref={listRef}
                className={styles.list}
                role="listbox"
              >
                {visible.length === 0 ? (
                  <div className={styles.empty} role="status">
                    {t('commands.noMatchingCommands')}
                  </div>
                ) : (
                  visible.map((item, index) => {
                    const isSelected = index === selectedIndex
                    const { command, matches } = item
                    return (
                      <div
                        key={command.id}
                        id={`cmd-item-${index}`}
                        data-index={index}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(styles.item, isSelected && styles.itemActive)}
                        onClick={() => runCommand(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className={styles.itemMain}>
                          <span className={styles.itemLabel}>
                            <FuzzyHighlight label={command.label} matches={matches} />
                          </span>
                          {command.description ? (
                            <span className={styles.itemDescription}>{command.description}</span>
                          ) : null}
                        </div>
                        {command.keybinding ? (
                          <KeybindingLabel value={command.keybinding} />
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className={styles.footer}>
              <span>
                <kbd className={styles.footerKey}>↑</kbd>
                <kbd className={styles.footerKey}>↓</kbd> {t('commands.footerHint')}
              </span>
              <span>
                <kbd className={styles.footerKey}>↵</kbd> {t('commands.footerSelect')}
              </span>
              <span>
                <kbd className={styles.footerKey}>esc</kbd> {t('commands.footerClose')}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
