import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'

export function GraphView() {
  const { graphData, loadGraph, loadCommitDetail } = useAppStore()

  useEffect(() => {
    loadGraph()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
          Commit Graph
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {graphData?.rows.map((row, i) => (
          <div
            key={row.commit.hash}
            className="flex items-center gap-3 px-3 py-1 hover:bg-[var(--color-secondary)] cursor-pointer border-b border-[var(--color-border)]"
            onClick={() => loadCommitDetail(row.commit.hash)}
          >
            {/* Graph visualization placeholder */}
            <span className="text-[var(--color-accent)] w-4">●</span>

            <span className="text-[var(--color-accent)] w-16 flex-shrink-0">
              {row.commit.hash.slice(0, 7)}
            </span>

            <span className="flex-1 text-[var(--color-foreground)] truncate">
              {row.commit.summary}
            </span>

            {/* Branch labels */}
            {row.branchLabels.map((label) => (
              <span
                key={label}
                className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-info)] text-[var(--color-background)]"
              >
                {label}
              </span>
            ))}

            {/* Tag labels */}
            {row.tagLabels.map((label) => (
              <span
                key={label}
                className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-warning)] text-[var(--color-background)]"
              >
                {label}
              </span>
            ))}

            <span className="text-[var(--color-muted-foreground)] w-20 text-right flex-shrink-0">
              {new Date(row.commit.time).toLocaleDateString()}
            </span>
          </div>
        ))}

        {!graphData && (
          <p className="px-3 py-8 text-sm text-[var(--color-muted-foreground)] text-center">
            Loading graph...
          </p>
        )}
      </div>
    </motion.div>
  )
}
