import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import styles from './StashView.module.scss'

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
      className={styles.container}
    >
      {/* Create stash */}
      <div className={styles.createSection}>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={stashMessage}
            onChange={(e) => setStashMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Stash message (optional)..."
            className={styles.messageInput}
          />
          <button
            onClick={handleCreate}
            className={styles.stashButton}
          >
            Stash
          </button>
        </div>
      </div>

      {/* Stash list */}
      <div className={styles.list}>
        {stashList.map((stash) => (
          <div
            key={stash.id}
            className={styles.stashItem}
          >
            <span className={styles.stashId}>
              stash@{'{'}
              {stash.id}
              {'}'}
            </span>
            <span className={styles.stashDescription}>
              {stash.description}
            </span>
            <div className={styles.actions}>
              <button
                onClick={() => applyStash(stash.id)}
                className={styles.applyButton}
              >
                Apply
              </button>
              <button
                onClick={() => popStash(stash.id)}
                className={styles.popButton}
              >
                Pop
              </button>
              <button
                onClick={() => deleteStash(stash.id)}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {stashList.length === 0 && (
          <p className={styles.emptyState}>
            No stashes
          </p>
        )}
      </div>
    </motion.div>
  )
}
