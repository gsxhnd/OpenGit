import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from './ui/button'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

export function WorkspaceSwitcher() {
  const { workspaceConfig, switchWorkspace, removeWorkspaceEntry, repoPath } = useAppStore()
  const [showAddDialog, setShowAddDialog] = useState(false)

  if (!workspaceConfig || workspaceConfig.entries.length === 0) {
    return null
  }

  const activeEntry = workspaceConfig.entries[workspaceConfig.activeIndex]

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/30 overflow-x-auto">
      <AnimatePresence>
        {workspaceConfig.entries.map((entry, index) => (
          <motion.div
            key={entry.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={() => switchWorkspace(index)}
              className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
                repoPath === entry.path
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <span className="truncate max-w-[150px]">{entry.name}</span>
            </button>
            <button
              onClick={() => removeWorkspaceEntry(entry.path)}
              className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove project"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 ml-auto"
        onClick={() => setShowAddDialog(true)}
      >
        <Plus size={14} />
      </Button>
    </div>
  )
}
