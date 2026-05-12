import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import type { ViewType } from '@shared/types'
import { cn } from '../lib/utils'

const NAV_ITEMS: { view: ViewType; label: string; icon: string }[] = [
  { view: 'commit', label: 'Commit', icon: '⊕' },
  { view: 'history', label: 'History', icon: '⏱' },
  { view: 'branches', label: 'Branches', icon: '⑂' },
  { view: 'stash', label: 'Stash', icon: '⊟' },
  { view: 'tags', label: 'Tags', icon: '⊙' },
  { view: 'graph', label: 'Graph', icon: '◈' },
  { view: 'file-search', label: 'Files', icon: '⊘' },
  { view: 'reflog', label: 'Reflog', icon: '↺' },
]

export function Sidebar() {
  const { currentView, setView } = useAppStore()

  return (
    <aside className="w-48 flex-shrink-0 bg-sidebar border-r border-border flex flex-col overflow-y-auto">
      <nav className="flex flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors',
              currentView === item.view
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {currentView === item.view && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-secondary rounded"
                transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 w-4 text-center">{item.icon}</span>
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
