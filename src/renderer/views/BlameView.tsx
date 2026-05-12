import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import styles from './BlameView.module.scss'

export function BlameView() {
  const { path } = useParams<{ path?: string }>()
  const navigate = useNavigate()
  const { blameData, blamePath, loadBlame } = useAppStore()

  useEffect(() => {
    if (path) {
      const decodedPath = decodeURIComponent(path)
      if (decodedPath !== blamePath) {
        loadBlame(decodedPath)
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
          Blame: {blamePath}
        </h3>
      </div>

      <div className={styles.content}>
        {blameData.map((line, i) => (
          <div
            key={i}
            className={styles.line}
          >
            <span className={styles.lineNumber}>
              {line.line}
            </span>

            <span
              className={styles.hash}
              onClick={() => handleCommitClick(line.hash)}
              title={line.summary}
            >
              {line.hash.slice(0, 7)}
            </span>

            <span className={styles.author}>
              {line.author}
            </span>

            <span className={styles.date}>
              {new Date(line.time).toLocaleDateString()}
            </span>

            <span className={styles.lineContent}>
              {line.content}
            </span>
          </div>
        ))}

        {blameData.length === 0 && (
          <p className={styles.emptyState}>
            No blame data
          </p>
        )}
      </div>
    </motion.div>
  )
}
