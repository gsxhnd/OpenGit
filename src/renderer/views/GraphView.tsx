import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import styles from './GraphView.module.scss'

export function GraphView() {
  const { graphData, loadGraph } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadGraph()
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
          Commit Graph
        </h3>
      </div>

      <div className={styles.list}>
        {graphData?.rows.map((row, i) => (
          <div
            key={row.commit.hash}
            className={styles.row}
            onClick={() => navigate(`/detail/${row.commit.hash}`)}
          >
            <span className={styles.graphDot}>●</span>

            <span className={styles.hash}>
              {row.commit.hash.slice(0, 7)}
            </span>

            <span className={styles.summary}>
              {row.commit.summary}
            </span>

            {row.branchLabels.map((label) => (
              <span
                key={label}
                className={styles.branchLabel}
              >
                {label}
              </span>
            ))}

            {row.tagLabels.map((label) => (
              <span
                key={label}
                className={styles.tagLabel}
              >
                {label}
              </span>
            ))}

            <span className={styles.date}>
              {new Date(row.commit.time).toLocaleDateString()}
            </span>
          </div>
        ))}

        {!graphData && (
          <p className={styles.emptyState}>
            Loading graph...
          </p>
        )}
      </div>
    </motion.div>
  )
}
