import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Input } from './ui/input'
import { Search } from 'lucide-react'

export interface Command {
  id: string
  label: string
  description?: string
  category: string
  action: () => void
  shortcut?: string
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const {
    setView,
    stageAll,
    unstageAll,
    doCommit,
    loadHistory,
    loadGraph,
    repoPath,
  } = useAppStore()

  const commands: Command[] = [
    {
      id: 'view-commit',
      label: 'Go to Commit View',
      category: 'Navigation',
      action: () => {
        setView('commit')
        setIsOpen(false)
      },
      shortcut: 'Ctrl+1',
    },
    {
      id: 'view-history',
      label: 'Go to History View',
      category: 'Navigation',
      action: () => {
        setView('history')
        setIsOpen(false)
      },
      shortcut: 'Ctrl+2',
    },
    {
      id: 'view-branches',
      label: 'Go to Branches View',
      category: 'Navigation',
      action: () => {
        setView('branches')
        setIsOpen(false)
      },
      shortcut: 'Ctrl+3',
    },
    {
      id: 'view-graph',
      label: 'Go to Graph View',
      category: 'Navigation',
      action: () => {
        setView('graph')
        setIsOpen(false)
      },
      shortcut: 'Ctrl+4',
    },
    {
      id: 'stage-all',
      label: 'Stage All Changes',
      category: 'Staging',
      action: () => {
        stageAll()
        setIsOpen(false)
      },
      shortcut: 'Ctrl+Shift+A',
    },
    {
      id: 'unstage-all',
      label: 'Unstage All Changes',
      category: 'Staging',
      action: () => {
        unstageAll()
        setIsOpen(false)
      },
      shortcut: 'Ctrl+Shift+U',
    },
  ]

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setIsOpen(!isOpen)
        setSearch('')
        setSelectedIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => (i + 1) % filteredCommands.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands])

  if (!repoPath) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Search size={18} className="text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Type a command..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedIndex(0)
                  }}
                  className="border-0 focus-visible:ring-0 text-base"
                />
              </div>

              {/* Commands list */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    No commands found
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((cmd, index) => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action()
                          setIsOpen(false)
                        }}
                        className={`w-full px-4 py-2 text-left transition-colors flex items-center justify-between ${
                          index === selectedIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs opacity-70">{cmd.description}</div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div className="text-xs opacity-50 ml-4">{cmd.shortcut}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
