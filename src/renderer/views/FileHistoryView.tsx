import { motion } from 'motion/react'
import { useAppStore } from '../store'

export function FileHistoryView() {
  const { fileHistoryPath, fileHistoryCommits, loadCommitDetail, goBack } = useAppStore()

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      <div className="px-3 py-2 border-b border-border">
        <button
          onClick={goBack}
          className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground mb-1"
        >
          ← Back
        </button>
        <h3 className="text-sm font-mono text-foreground">
          History: {fileHistoryPath}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {fileHistoryCommits.map((commit) => (
          <div
            key={commit.hash}
            className="flex items-center gap-3 px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border"
            onClick={() => loadCommitDetail(commit.hash)}
          >
            <span className="font-mono text-xs text-accent w-16 flex-shrink-0">
              {commit.hash.slice(0, 7)}
            </span>
            <span className="flex-1 text-sm text-foreground truncate">
              {commit.summary}
            </span>
            <span className="text-xs text-muted-foreground">
              {commit.author.split(' <')[0]}
            </span>
            <span className="text-xs text-muted-foreground w-20 text-right">
              {new Date(commit.time).toLocaleDateString()}
            </span>
          </div>
        ))}

        {fileHistoryCommits.length === 0 && (
          <p className="px-3 py-8 text-sm text-muted-foreground text-center">
            No history for this file
          </p>
        )}
      </div>
    </motion.div>
  )
}
