import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import styles from './ReflogView.module.scss'

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
      className={styles.container}
    >
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>
          Reflog
        </h3>
        <button
          onClick={loadReflog}
          className={styles.reloadButton}
        >
          Reload
        </button>
      </div>

      <div className={styles.warning}>
        <p className={styles.warningText}>
          Reflog shows local history of HEAD changes. Use with caution.
        </p>
      </div>

      <div className={styles.list}>
        {reflogEntries.map((entry, i) => (
          <div
            key={i}
            className={styles.row}
          >
            <span className={styles.newHash}>
              {entry.newHash.slice(0, 7)}
            </span>
            <span className={styles.arrow}>←</span>
            <span className={styles.oldHash}>
              {entry.oldHash.slice(0, 7)}
            </span>
            <span className={styles.message}>
              {entry.message}
            </span>
            <span className={styles.committer}>
              {entry.committer.split(' <')[0]}
            </span>
            <span className={styles.date}>
              {entry.time ? new Date(entry.time).toLocaleDateString() : ''}
            </span>
          </div>
        ))}

        {reflogEntries.length === 0 && (
          <p className={styles.emptyState}>
            No reflog entries
          </p>
        )}
      </div>
    </motion.div>
  )
}
