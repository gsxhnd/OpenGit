import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'

export function ReflogView() {
  const { reflogEntries, loadReflog } = useAppStore()

  useEffect(() => {
    loadReflog()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
          Reflog
        </h3>
        <button
          onClick={loadReflog}
          className="px-2 py-0.5 text-xs rounded hover:bg-[var(--color-secondary)] text-[var(--color-accent)]"
        >
          Reload
        </button>
      </div>

      <div className="px-3 py-1.5 bg-[var(--color-muted)] border-b border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-warning)]">
          Reflog shows local history of HEAD changes. Use with caution.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {reflogEntries.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-secondary)] border-b border-[var(--color-border)]"
          >
            <span className="text-[var(--color-muted-foreground)] w-16 flex-shrink-0">
              {entry.newHash.slice(0, 7)}
            </span>
            <span className="text-[var(--color-muted-foreground)]">←</span>
            <span className="text-[var(--color-muted-foreground)] w-16 flex-shrink-0">
              {entry.oldHash.slice(0, 7)}
            </span>
            <span className="flex-1 text-[var(--color-foreground)] truncate">
              {entry.message}
            </span>
            <span className="text-[var(--color-muted-foreground)] flex-shrink-0">
              {entry.committer.split(' <')[0]}
            </span>
            <span className="text-[var(--color-muted-foreground)] w-20 text-right flex-shrink-0">
              {entry.time ? new Date(entry.time).toLocaleDateString() : ''}
            </span>
          </div>
        ))}

        {reflogEntries.length === 0 && (
          <p className="px-3 py-8 text-sm text-[var(--color-muted-foreground)] text-center">
            No reflog entries
          </p>
        )}
      </div>
    </motion.div>
  )
}
