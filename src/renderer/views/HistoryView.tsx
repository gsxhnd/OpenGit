/**
 * HistoryView - 提交历史视图
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import styles from './HistoryView.module.scss'

export function HistoryView() {
  const {
    historyCommits,
    loadHistory,
    loadMoreHistory,
    searchCommits,
    clearSearch,
    searchQuery,
    searchResults,
    isSearching,
    historyFilterAuthor,
    historyFilterFile,
    clearFilters,
    filterByAuthor,
    filterByFile,
  } = useAppStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState(searchQuery)
  const [filterInput, setFilterInput] = useState('')
  const [filterType, setFilterType] = useState<'author' | 'file'>('author')

  useEffect(() => {
    loadHistory()
  }, [])

  const handleSearch = () => {
    if (search.trim()) {
      searchCommits(search.trim())
    } else {
      clearSearch()
    }
  }

  const handleFilter = () => {
    if (!filterInput.trim()) return
    if (filterType === 'author') {
      filterByAuthor(filterInput.trim())
    } else {
      filterByFile(filterInput.trim())
    }
    setFilterInput('')
  }

  const commits = searchResults.length > 0 ? searchResults : historyCommits

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      {/* 搜索和筛选栏 */}
      <div className={styles.searchBar}>
        <div className={styles.searchRow}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search commits (hash, message, author)..."
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            Search
          </Button>
        </div>

        <div className={styles.filterRow}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'author' | 'file')}
            className={styles.filterSelect}
          >
            <option value="author">Author</option>
            <option value="file">File</option>
          </select>
          <Input
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            placeholder={`Filter by ${filterType}...`}
          />
          <Button variant="secondary" size="xs" onClick={handleFilter}>
            Filter
          </Button>
        </div>

        {/* 活跃筛选条件 */}
        {(historyFilterAuthor || historyFilterFile) && (
          <div className={styles.activeFilters}>
            {historyFilterAuthor && (
              <Badge variant="default">Author: {historyFilterAuthor}</Badge>
            )}
            {historyFilterFile && (
              <Badge variant="default">File: {historyFilterFile}</Badge>
            )}
            <button onClick={clearFilters} className={styles.clearButton}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* 提交列表 */}
      <ScrollArea className={styles.commitList}>
        {isSearching && (
          <p className={styles.emptyState}>Searching...</p>
        )}
        {commits.map((commit) => (
          <div
            key={commit.hash}
            className={styles.commitRow}
            onClick={() => navigate(`/detail/${commit.hash}`)}
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

        {commits.length > 0 && !searchResults.length && (
          <button onClick={loadMoreHistory} className={styles.loadMore}>
            Load more...
          </button>
        )}

        {commits.length === 0 && !isSearching && (
          <p className={styles.emptyState}>No commits found</p>
        )}
      </ScrollArea>
    </motion.div>
  )
}
