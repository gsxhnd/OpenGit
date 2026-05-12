import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import styles from './FileHistoryView.module.scss'

export function FileHistoryView() {
  const { path } = useParams<{ path?: string }>()
  const navigate = useNavigate()
  const { fileHistoryPath, fileHistoryCommits, loadFileHistory } = useAppStore()

  useEffect(() => {
    if (path) {
      const decodedPath = decodeURIComponent(path)
      if (decodedPath !== fileHistoryPath) {
        loadFileHistory(decodedPath)
      }
    }
  }, [path])

  const handleCommitClick = (hash: string) => {
    navigate(`/detail/${hash}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      <div className={styles.header}>
        <button
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          ← Back
        </button>
        <h3 className={styles.title}>
          History: {fileHistoryPath}
        </h3>
      </div>

      <div className={styles.list}>
        {fileHistoryCommits.map((commit) => (
          <div
            key={commit.hash}
            className={styles.commitRow}
            onClick={() => handleCommitClick(commit.hash)}
          >
            <span className={styles.commitHash}>
              {commit.hash.slice(0, 7)}
            </span>
            <span className={styles.commitSummary}>
              {commit.summary}
            </span>
            <span className={styles.commitAuthor}>
              {commit.author.split(' <')[0]}
            </span>
            <span className={styles.commitDate}>
              {new Date(commit.time).toLocaleDateString()}
            </span>
          </div>
        ))}

        {fileHistoryCommits.length === 0 && (
          <p className={styles.emptyState}>
            No history for this file
          </p>
        )}
      </div>
    </motion.div>
  )
}
