import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import styles from './TagsView.module.scss'

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
      className={styles.container}
    >
      {/* Create tag */}
      <div className={styles.createSection}>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Tag name..."
            className={styles.nameInput}
          />
          <button
            onClick={handleCreate}
            disabled={!tagName.trim()}
            className={styles.createButton}
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
          className={styles.messageInput}
        />
      </div>

      {/* Tag list */}
      <div className={styles.list}>
        {tagList.map((tag) => (
          <div
            key={tag.name}
            className={styles.tagItem}
          >
            <span className={styles.tagIcon}>⊙</span>
            <span className={styles.tagName}>{tag.name}</span>
            {tag.message && (
              <span className={styles.annotatedBadge}>
                annotated
              </span>
            )}
            <button
              onClick={() => deleteTag(tag.name)}
              className={styles.deleteButton}
            >
              Delete
            </button>
          </div>
        ))}

        {tagList.length === 0 && (
          <p className={styles.emptyState}>
            No tags
          </p>
        )}
      </div>
    </motion.div>
  )
}
