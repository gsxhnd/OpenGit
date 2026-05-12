import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import styles from './FileSearchView.module.scss'

export function FileSearchView() {
  const { fileSearchResults, searchFiles, loadFileDiff } =
    useAppStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (query.trim()) {
      searchFiles(query.trim())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      {/* Search input */}
      <div className={styles.searchBar}>
        <div className={styles.searchRow}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search files by name..."
            className={styles.searchInput}
          />
          <button
            onClick={handleSearch}
            className={styles.searchButton}
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div className={styles.results}>
        {fileSearchResults.map((filePath) => (
          <div
            key={filePath}
            className={styles.resultRow}
          >
            <span className={styles.filePath}>
              {filePath}
            </span>
            <div className={styles.actions}>
              <button
                onClick={() => {
                  loadFileDiff(filePath)
                  navigate('/diff')
                }}
                className={`${styles.actionButton} ${styles.actionDiff}`}
              >
                Diff
              </button>
              <button
                onClick={() => {
                  navigate(`/file-history/${encodeURIComponent(filePath)}`)
                }}
                className={`${styles.actionButton} ${styles.actionHistory}`}
              >
                History
              </button>
              <button
                onClick={() => {
                  navigate(`/blame/${encodeURIComponent(filePath)}`)
                }}
                className={`${styles.actionButton} ${styles.actionBlame}`}
              >
                Blame
              </button>
            </div>
          </div>
        ))}

        {fileSearchResults.length === 0 && query && (
          <p className={styles.emptyState}>
            No files found
          </p>
        )}

        {!query && (
          <p className={styles.emptyState}>
            Enter a file name to search
          </p>
        )}
      </div>
    </motion.div>
  )
}
