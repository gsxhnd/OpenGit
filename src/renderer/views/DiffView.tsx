import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { SideBySideDiffView } from '../components/SideBySideDiffView'
import styles from './DiffView.module.scss'

export function DiffView() {
  const {
    diffPreview,
    stageHunk,
    unstageHunk,
    selectedDiffPath,
    selectedStagedDiffPath,
    diffViewMode,
    setDiffViewMode,
  } = useAppStore()
  const navigate = useNavigate()

  if (!diffPreview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.emptyState}
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
        onGoBack={() => navigate(-1)}
      />
    )
  }

  if (diffPreview.isBinary) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className={styles.container}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => navigate(-1)}
              className={styles.backButton}
            >
              ← Back
            </button>
            <span className={styles.filePath}>
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
        <div className={styles.binaryContent}>
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
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            ← Back
          </button>
          <span className={styles.filePath}>
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
      <div className={styles.diffContent}>
        {diffPreview.hunks.map((hunk, hi) => (
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
                className={`${styles.line} ${line.prefix === '+' ? styles.lineAdded : ''} ${line.prefix === '-' ? styles.lineDeleted : ''} ${line.prefix === ' ' ? styles.lineContext : ''}`}
              >
                <span className={styles.linePrefix}>
                  {line.prefix}
                </span>
                {line.content}
              </div>
            ))}
          </div>
        ))}

        {diffPreview.hunks.length === 0 && (
          <p className={styles.emptyDiff}>
            No changes
          </p>
        )}
      </div>
    </motion.div>
  )
}
