import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { SideBySideDiffView } from '../components/SideBySideDiffView'

export function DiffView() {
  const {
    diffPreview,
    goBack,
    stageHunk,
    unstageHunk,
    selectedDiffPath,
    selectedStagedDiffPath,
    diffViewMode,
    setDiffViewMode,
  } = useAppStore()

  if (!diffPreview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full text-muted-foreground"
      >
        No diff selected
      </motion.div>
    )
  }

  const isStaged = selectedStagedDiffPath === diffPreview.path

  // Render side-by-side view if selected
  if (diffViewMode === 'side-by-side') {
    return (
      <SideBySideDiffView
        diff={diffPreview}
        isStaged={isStaged}
        onStageHunk={(hunkIndex) => stageHunk(diffPreview.path, hunkIndex)}
        onUnstageHunk={(hunkIndex) => unstageHunk(diffPreview.path, hunkIndex)}
        onGoBack={goBack}
      />
    )
  }

  if (diffPreview.isBinary) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground"
            >
              ← Back
            </button>
            <span className="text-sm font-mono text-foreground">
              {diffPreview.path}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() => setDiffViewMode(diffViewMode === 'unified' ? 'side-by-side' : 'unified')}
          >
            {diffViewMode === 'unified' ? 'Side-by-side' : 'Unified'}
          </Button>
        </div>
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          Binary file
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground"
          >
            ← Back
          </button>
          <span className="text-sm font-mono text-foreground">
            {diffPreview.path}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={() => setDiffViewMode(diffViewMode === 'unified' ? 'side-by-side' : 'unified')}
        >
          {diffViewMode === 'unified' ? 'Side-by-side' : 'Unified'}
        </Button>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-5">
        {diffPreview.hunks.map((hunk, hi) => (
          <div key={hi}>
            {/* Hunk header with controls */}
            <div className="flex items-center justify-between px-3 py-1 bg-muted text-info sticky top-0 group">
              <div className="flex-1">
                @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},
                {hunk.newRange.count} @@ {hunk.header}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isStaged ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => unstageHunk(diffPreview.path, hi)}
                  >
                    Unstage
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => stageHunk(diffPreview.path, hi)}
                  >
                    Stage
                  </Button>
                )}
              </div>
            </div>
            {/* Lines */}
            {hunk.lines.map((line, li) => (
              <div
                key={li}
                className={cn(
                  'px-3 whitespace-pre',
                  line.prefix === '+' && 'bg-diff-added-bg text-diff-added',
                  line.prefix === '-' && 'bg-diff-deleted-bg text-diff-deleted',
                  line.prefix === ' ' && 'text-foreground'
                )}
              >
                <span className="inline-block w-4 text-muted-foreground select-none">
                  {line.prefix}
                </span>
                {line.content}
              </div>
            ))}
          </div>
        ))}

        {diffPreview.hunks.length === 0 && (
          <p className="px-3 py-8 text-center text-muted-foreground">
            No changes
          </p>
        )}
      </div>
    </motion.div>
  )
}
