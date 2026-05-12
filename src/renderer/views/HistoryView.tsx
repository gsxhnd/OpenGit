import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export function HistoryView() {
  const {
    historyCommits,
    loadHistory,
    loadMoreHistory,
    loadCommitDetail,
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
      className="flex flex-col h-full"
    >
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-border space-y-2">
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search commits (hash, message, author)..."
            className="h-8 text-sm"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch} className="h-8">
            Search
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 items-center">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'author' | 'file')}
            className="h-8 px-2 text-xs bg-muted border border-border rounded text-foreground"
          >
            <option value="author">Author</option>
            <option value="file">File</option>
          </select>
          <Input
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            placeholder={`Filter by ${filterType}...`}
            className="h-7 text-xs flex-1"
          />
          <Button variant="secondary" size="sm" onClick={handleFilter} className="h-7 text-xs">
            Filter
          </Button>
        </div>

        {/* Active filters */}
        {(historyFilterAuthor || historyFilterFile) && (
          <div className="flex gap-2 items-center">
            {historyFilterAuthor && (
              <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                Author: {historyFilterAuthor}
              </span>
            )}
            {historyFilterFile && (
              <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                File: {historyFilterFile}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-destructive hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Commit list */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            Searching...
          </p>
        )}
        {commits.map((commit) => (
          <div
            key={commit.hash}
            className="flex items-center gap-3 px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border group"
            onClick={() => loadCommitDetail(commit.hash)}
          >
            <span className="font-mono text-xs text-accent w-16 flex-shrink-0">
              {commit.hash.slice(0, 7)}
            </span>
            <span className="flex-1 text-sm text-foreground truncate">
              {commit.summary}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {commit.author.split(' <')[0]}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0 w-20 text-right">
              {new Date(commit.time).toLocaleDateString()}
            </span>
          </div>
        ))}

        {commits.length > 0 && !searchResults.length && (
          <button
            onClick={loadMoreHistory}
            className="w-full py-3 text-sm text-accent hover:bg-secondary"
          >
            Load more...
          </button>
        )}

        {commits.length === 0 && !isSearching && (
          <p className="px-3 py-8 text-sm text-muted-foreground text-center">
            No commits found
          </p>
        )}
      </div>
    </motion.div>
  )
}
