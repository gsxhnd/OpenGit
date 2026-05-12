import { motion } from 'motion/react'
import { FileDiff, DiffHunk, DiffLine } from '@shared/types'
import { Button } from './ui/button'
import styles from './SideBySideDiffView.module.scss'

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

function getLeftLineClass(prefix: string): string {
  if (prefix === '-') return `${styles.line} ${styles.lineDeleted}`
  if (prefix === '+') return `${styles.line} ${styles.lineFiller}`
  return `${styles.line} ${styles.lineContext}`
}

function getRightLineClass(prefix: string): string {
  if (prefix === '+') return `${styles.line} ${styles.lineAdded}`
  if (prefix === '-') return `${styles.line} ${styles.lineFiller}`
  return `${styles.line} ${styles.lineContext}`
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
        className={styles.container}
      >
        <div className={styles.header}>
          <button onClick={onGoBack} className={styles.backButton}>
            ← Back
          </button>
          <span className={styles.filePath}>{diff.path}</span>
        </div>
        <div className={styles.binaryMessage}>
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
      className={styles.container}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={onGoBack} className={styles.backButton}>
            ← Back
          </button>
          <span className={styles.filePath}>{diff.path}</span>
        </div>
      </div>

      {/* Side-by-side diff content */}
      <div className={styles.diffContent}>
        {diff.hunks.map((hunk, hi) => {
          const { left, right } = buildSideBySideLines(hunk)

          return (
            <div key={hi}>
              {/* Hunk header with controls */}
              <div className={styles.hunkHeader}>
                <div className={styles.hunkHeaderText}>
                  @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},
                  {hunk.newRange.count} @@ {hunk.header}
                </div>
                <div className={styles.hunkControls}>
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
              <div className={styles.sideBySideContainer}>
                {/* Left side (old) */}
                <div className={styles.leftSide}>
                  {left.map((item, li) => (
                    <div key={`left-${li}`} className={getLeftLineClass(item.line.prefix)}>
                      <span className={styles.lineNumber}>
                        {item.oldLineNum ?? ''}
                      </span>
                      <span className={styles.linePrefix}>
                        {item.line.prefix === '-' ? '-' : item.line.prefix === '+' ? '' : ' '}
                      </span>
                      <span className={styles.lineContent}>{item.line.content}</span>
                    </div>
                  ))}
                </div>

                {/* Right side (new) */}
                <div className={styles.rightSide}>
                  {right.map((item, li) => (
                    <div key={`right-${li}`} className={getRightLineClass(item.line.prefix)}>
                      <span className={styles.lineNumber}>
                        {item.newLineNum ?? ''}
                      </span>
                      <span className={styles.linePrefix}>
                        {item.line.prefix === '+' ? '+' : item.line.prefix === '-' ? '' : ' '}
                      </span>
                      <span className={styles.lineContent}>{item.line.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {diff.hunks.length === 0 && (
          <p className={styles.emptyState}>No changes</p>
        )}
      </div>
    </motion.div>
  )
}
