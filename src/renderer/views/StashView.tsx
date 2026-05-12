import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'

export function StashView() {
  const { stashList, loadStashes, createStash, applyStash, popStash, deleteStash } =
    useAppStore()

  const [stashMessage, setStashMessage] = useState('')

  useEffect(() => {
    loadStashes()
  }, [])

  const handleCreate = () => {
    createStash(stashMessage.trim() || undefined)
    setStashMessage('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Create stash */}
      <div className="px-3 py-3 border-b border-[var(--color-border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={stashMessage}
            onChange={(e) => setStashMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Stash message (optional)..."
            className="flex-1 px-3 py-1.5 text-sm bg-[var(--color-muted)] border border-[var(--color-input-border)] rounded-md text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-xs rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90"
          >
            Stash
          </button>
        </div>
      </div>

      {/* Stash list */}
      <div className="flex-1 overflow-y-auto">
        {stashList.map((stash) => (
          <div
            key={stash.id}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-secondary)] border-b border-[var(--color-border)] group"
          >
            <span className="text-xs font-mono text-[var(--color-muted-foreground)]">
              stash@{'{'}
              {stash.id}
              {'}'}
            </span>
            <span className="flex-1 text-sm text-[var(--color-foreground)] truncate">
              {stash.description}
            </span>
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={() => applyStash(stash.id)}
                className="px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-success)]"
              >
                Apply
              </button>
              <button
                onClick={() => popStash(stash.id)}
                className="px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-accent)]"
              >
                Pop
              </button>
              <button
                onClick={() => deleteStash(stash.id)}
                className="px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-danger)]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {stashList.length === 0 && (
          <p className="px-3 py-8 text-sm text-[var(--color-muted-foreground)] text-center">
            No stashes
          </p>
        )}
      </div>
    </motion.div>
  )
}
