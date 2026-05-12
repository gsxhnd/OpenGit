import { motion } from 'motion/react'
import { useAppStore } from '../store'

export function BlameView() {
  const { blameData, blamePath, goBack, loadCommitDetail } = useAppStore()

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
          Blame: {blamePath}
        </h3>
      </div>

      <div className="flex-1 overflow-auto font-mono text-xs leading-5">
        {blameData.map((line, i) => (
          <div
            key={i}
            className="flex hover:bg-secondary border-b border-border"
          >
            {/* Line number */}
            <span className="w-10 text-right pr-2 text-muted-foreground select-none flex-shrink-0">
              {line.line}
            </span>

            {/* Blame info */}
            <span
              className="w-16 text-accent cursor-pointer hover:underline flex-shrink-0"
              onClick={() => loadCommitDetail(line.hash)}
              title={line.summary}
            >
              {line.hash.slice(0, 7)}
            </span>

            <span className="w-24 text-muted-foreground truncate flex-shrink-0">
              {line.author}
            </span>

            <span className="w-20 text-muted-foreground flex-shrink-0">
              {new Date(line.time).toLocaleDateString()}
            </span>

            {/* Content */}
            <span className="flex-1 text-foreground whitespace-pre pl-2">
              {line.content}
            </span>
          </div>
        ))}

        {blameData.length === 0 && (
          <p className="px-3 py-8 text-sm text-muted-foreground text-center">
            No blame data
          </p>
        )}
      </div>
    </motion.div>
  )
}
