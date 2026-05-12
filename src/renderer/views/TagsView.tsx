import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'

export function TagsView() {
  const { tagList, loadTags, createTag, deleteTag } = useAppStore()

  const [tagName, setTagName] = useState('')
  const [tagMessage, setTagMessage] = useState('')

  useEffect(() => {
    loadTags()
  }, [])

  const handleCreate = () => {
    if (!tagName.trim()) return
    createTag(tagName.trim(), undefined, tagMessage.trim() || undefined)
    setTagName('')
    setTagMessage('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Create tag */}
      <div className="px-3 py-3 border-b border-[var(--color-border)] space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Tag name..."
            className="flex-1 px-3 py-1.5 text-sm bg-[var(--color-muted)] border border-[var(--color-input-border)] rounded-md text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
          />
          <button
            onClick={handleCreate}
            disabled={!tagName.trim()}
            className="px-3 py-1.5 text-xs rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-40"
          >
            Create
          </button>
        </div>
        <input
          type="text"
          value={tagMessage}
          onChange={(e) => setTagMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Message (optional, makes annotated tag)..."
          className="w-full px-3 py-1.5 text-sm bg-[var(--color-muted)] border border-[var(--color-input-border)] rounded-md text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
        />
      </div>

      {/* Tag list */}
      <div className="flex-1 overflow-y-auto">
        {tagList.map((tag) => (
          <div
            key={tag.name}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-secondary)] border-b border-[var(--color-border)] group"
          >
            <span className="text-sm text-[var(--color-warning)]">⊙</span>
            <span className="flex-1 text-sm text-[var(--color-foreground)]">{tag.name}</span>
            {tag.message && (
              <span className="text-xs text-[var(--color-muted-foreground)] italic">
                annotated
              </span>
            )}
            <button
              onClick={() => deleteTag(tag.name)}
              className="hidden group-hover:block px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-danger)]"
            >
              Delete
            </button>
          </div>
        ))}

        {tagList.length === 0 && (
          <p className="px-3 py-8 text-sm text-[var(--color-muted-foreground)] text-center">
            No tags
          </p>
        )}
      </div>
    </motion.div>
  )
}
