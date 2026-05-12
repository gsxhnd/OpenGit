import { motion } from 'motion/react'
import { FileDiff, DiffHunk, DiffLine } from '@shared/types'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

interface SideBySideDiffViewProps {
  diff: FileDiff
  isStaged: boolean
  onStageHunk: (hunkIndex: number) => void
  onUnstageHunk: (hunkIndex: number) => void
  onGoBack: () => void
}

interface LineWithNumber {
  line: DiffLine
  oldLineNum: number | null
  newLineNum: number | null
}

function buildSideBySideLines(hunk: DiffHunk): { left: LineWithNumber[]; right: LineWithNumber[] } {
  const left: LineWithNumber[] = []
  const right: LineWithNumber[] = []

  let oldLine = hunk.oldRange.start
  let newLine = hunk.newRange.start

  for (const line of hunk.lines) {
    if (line.prefix === '-') {
      left.push({ line, oldLineNum: oldLine, newLineNum: null })
      oldLine++
    } else if (line.prefix === '+') {
      right.push({ line, oldLineNum: null, newLineNum: newLine })
      newLine++
    } else {
      left.push({ line, oldLineNum: oldLine, newLineNum: null })
      right.push({ line, oldLineNum: null, newLineNum: newLine })
      oldLine++
      newLine++
    }
  }

  // Pad to same length
  const maxLen = Math.max(left.length, right.length)
  while (left.length < maxLen) {
    left.push({ line: { prefix: ' ', content: '', oldLine: null, newLine: null }, oldLineNum: null, newLineNum: null })
  }
  while (right.length < maxLen) {
    right.push({ line: { prefix: ' ', content: '', oldLine: null, newLine: null }, oldLineNum: null, newLineNum: null })
  }

  return { left, right }
}

export function SideBySideDiffView({
  diff,
  isStaged,
  onStageHunk,
  onUnstageHunk,
  onGoBack,
}: SideBySideDiffViewProps) {
  if (diff.isBinary) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-full"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <button
            onClick={onGoBack}
            className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground"
          >
            ← Back
          </button>
          <span className="text-sm font-mono text-foreground">{diff.path}</span>
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
            onClick={onGoBack}
            className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground"
          >
            ← Back
          </button>
          <span className="text-sm font-mono text-foreground">{diff.path}</span>
        </div>
      </div>

      {/* Side-by-side diff content */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-5">
        {diff.hunks.map((hunk, hi) => {
          const { left, right } = buildSideBySideLines(hunk)

          return (
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
                      onClick={() => onUnstageHunk(hi)}
                    >
                      Unstage
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => onStageHunk(hi)}
                    >
                      Stage
                    </Button>
                  )}
                </div>
              </div>

              {/* Side-by-side lines */}
              <div className="flex border-b border-border">
                {/* Left side (old) */}
                <div className="flex-1 border-r border-border">
                  {left.map((item, li) => (
                    <div
                      key={`left-${li}`}
                      className={cn(
                        'flex px-2 whitespace-pre',
                        item.line.prefix === '-' && 'bg-diff-deleted-bg text-diff-deleted',
                        item.line.prefix === ' ' && 'text-foreground',
                        item.line.prefix === '+' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      <span className="w-8 text-right text-muted-foreground select-none pr-2">
                        {item.oldLineNum ?? ''}
                      </span>
                      <span className="inline-block w-4 text-muted-foreground select-none">
                        {item.line.prefix === '-' ? '-' : item.line.prefix === '+' ? '' : ' '}
                      </span>
                      <span className="flex-1">{item.line.content}</span>
                    </div>
                  ))}
                </div>

                {/* Right side (new) */}
                <div className="flex-1">
                  {right.map((item, li) => (
                    <div
                      key={`right-${li}`}
                      className={cn(
                        'flex px-2 whitespace-pre',
                        item.line.prefix === '+' && 'bg-diff-added-bg text-diff-added',
                        item.line.prefix === ' ' && 'text-foreground',
                        item.line.prefix === '-' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      <span className="w-8 text-right text-muted-foreground select-none pr-2">
                        {item.newLineNum ?? ''}
                      </span>
                      <span className="inline-block w-4 text-muted-foreground select-none">
                        {item.line.prefix === '+' ? '+' : item.line.prefix === '-' ? '' : ' '}
                      </span>
                      <span className="flex-1">{item.line.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {diff.hunks.length === 0 && (
          <p className="px-3 py-8 text-center text-muted-foreground">No changes</p>
        )}
      </div>
    </motion.div>
  )
}
