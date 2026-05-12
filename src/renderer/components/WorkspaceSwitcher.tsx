import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from './ui/button'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import styles from './WorkspaceSwitcher.module.scss'

export function WorkspaceSwitcher() {
  const { workspaceConfig, switchWorkspace, removeWorkspaceEntry, repoPath } = useAppStore()
  const [showAddDialog, setShowAddDialog] = useState(false)

  if (!workspaceConfig || workspaceConfig.entries.length === 0) {
    return null
  }

  const activeEntry = workspaceConfig.entries[workspaceConfig.activeIndex]

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {workspaceConfig.entries.map((entry, index) => (
          <motion.div
            key={entry.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={styles.entryWrapper}
          >
            <button
              onClick={() => switchWorkspace(index)}
              className={`${styles.tabButton} ${
                repoPath === entry.path ? styles.active : styles.inactive
              }`}
            >
              <span className={styles.tabLabel}>{entry.name}</span>
            </button>
            <button
              onClick={() => removeWorkspaceEntry(entry.path)}
              className={styles.removeButton}
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
        className={styles.addButton}
        onClick={() => setShowAddDialog(true)}
      >
        <Plus size={14} />
      </Button>
    </div>
  )
}
