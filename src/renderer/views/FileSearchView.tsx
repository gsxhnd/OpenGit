import { useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'

export function FileSearchView() {
  const { fileSearchResults, searchFiles, loadFileDiff, loadFileHistory, loadBlame, setView } =
    useAppStore()

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
      className="flex flex-col h-full"
    >
      {/* Search input */}
      <div className="px-3 py-3 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search files by name..."
            className="flex-1 px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {fileSearchResults.map((filePath) => (
          <div
            key={filePath}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary group border-b border-border"
          >
            <span className="flex-1 text-sm font-mono text-foreground truncate">
              {filePath}
            </span>
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={() => {
                  loadFileDiff(filePath)
                  setView('diff')
                }}
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-accent"
              >
                Diff
              </button>
              <button
                onClick={() => loadFileHistory(filePath)}
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-info"
              >
                History
              </button>
              <button
                onClick={() => loadBlame(filePath)}
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-warning"
              >
                Blame
              </button>
            </div>
          </div>
        ))}

        {fileSearchResults.length === 0 && query && (
          <p className="px-3 py-8 text-sm text-muted-foreground text-center">
            No files found
          </p>
        )}

        {!query && (
          <p className="px-3 py-8 text-sm text-muted-foreground text-center">
            Enter a file name to search
          </p>
        )}
      </div>
    </motion.div>
  )
}
