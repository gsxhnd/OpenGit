import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'

export function CommitDetailView() {
  const { selectedCommitDetail, selectedCommitDiff, goBack } = useAppStore()

  if (!selectedCommitDetail) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-muted-foreground)]">
        No commit selected
      </div>
    )
  }

  const commit = selectedCommitDetail

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <button
          onClick={goBack}
          className="px-2 py-0.5 text-xs rounded hover:bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] mb-2"
        >
          ← Back
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-accent)]">
              {commit.hash.slice(0, 12)}
            </span>
          </div>
          <h2 className="text-sm font-medium text-[var(--color-foreground)]">
            {commit.summary}
          </h2>
          {commit.message !== commit.summary && (
            <p className="text-xs text-[var(--color-muted-foreground)] whitespace-pre-wrap">
              {commit.message.slice(commit.summary.length).trim()}
            </p>
          )}
          <div className="flex gap-4 text-xs text-[var(--color-muted-foreground)]">
            <span>Author: {commit.author}</span>
            <span>{new Date(commit.time).toLocaleString()}</span>
          </div>
          {commit.parents.length > 0 && (
            <div className="text-xs text-[var(--color-muted-foreground)]">
              Parents: {commit.parents.map((p) => p.slice(0, 7)).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Changed files with diffs */}
      <div className="flex-1 overflow-y-auto">
        {selectedCommitDiff.map((fileDiff, fi) => (
          <div key={fi} className="border-b border-[var(--color-border)]">
            <div className="px-3 py-1.5 bg-[var(--color-muted)] text-sm font-mono text-[var(--color-foreground)]">
              {fileDiff.path}
            </div>
            {fileDiff.isBinary ? (
              <div className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                Binary file
              </div>
            ) : (
              <div className="font-mono text-xs leading-5">
                {fileDiff.hunks.map((hunk, hi) => (
                  <div key={hi}>
                    <div className="px-3 py-0.5 text-[var(--color-info)] bg-[var(--color-muted)]">
                      @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},
                      {hunk.newRange.count} @@ {hunk.header}
                    </div>
                    {hunk.lines.map((line, li) => (
                      <div
                        key={li}
                        className={cn(
                          'px-3 whitespace-pre',
                          line.prefix === '+' &&
                            'bg-[var(--color-diff-added-bg)] text-[var(--color-diff-added)]',
                          line.prefix === '-' &&
                            'bg-[var(--color-diff-deleted-bg)] text-[var(--color-diff-deleted)]',
                          line.prefix === ' ' && 'text-[var(--color-foreground)]'
                        )}
                      >
                        <span className="inline-block w-4 text-[var(--color-muted-foreground)] select-none">
                          {line.prefix}
                        </span>
                        {line.content}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {selectedCommitDiff.length === 0 && (
          <p className="px-3 py-8 text-sm text-[var(--color-muted-foreground)] text-center">
            No changes in this commit
          </p>
        )}
      </div>
    </motion.div>
  )
}
