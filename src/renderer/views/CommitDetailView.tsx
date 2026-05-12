/**
 * CommitDetailView - 提交详情视图
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import styles from './CommitDetailView.module.scss'

export function CommitDetailView() {
  const { hash } = useParams<{ hash?: string }>()
  const navigate = useNavigate()
  const {
    selectedCommitDetail,
    selectedCommitDiff,
    loadCommitDetail,
    doCherryPick,
    revertCommit,
    doReset,
  } = useAppStore()

  const [showResetDialog, setShowResetDialog] = useState(false)

  useEffect(() => {
    if (hash) {
      loadCommitDetail(hash)
    }
  }, [hash])

  if (!hash) {
    return (
      <div className={styles.emptyState}>
        No commit specified
      </div>
    )
  }

  if (!selectedCommitDetail) {
    return (
      <div className={styles.emptyState}>
        Loading...
      </div>
    )
  }

  const commit = selectedCommitDetail

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            ← Back
          </button>
          <div className={styles.actionButtons}>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs text-info border-info/30 hover:bg-info/10"
              onClick={() => doCherryPick(commit.hash)}
              title="Cherry-pick this commit onto current branch"
            >
              Cherry-pick
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs text-warning border-warning/30 hover:bg-warning/10"
              onClick={() => revertCommit(commit.hash)}
              title="Create a new commit that undoes this commit"
            >
              Revert
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowResetDialog(!showResetDialog)}
              title="Reset HEAD to this commit"
            >
              Reset
            </Button>
          </div>
        </div>

        {showResetDialog && (
          <div className={styles.resetDialog}>
            <p className={styles.resetDialogText}>
              Reset HEAD to <span className={styles.resetDialogHash}>{commit.hash.slice(0, 7)}</span>:
            </p>
            <div className={styles.resetDialogButtons}>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => { doReset(commit.hash, 'soft'); setShowResetDialog(false) }}
              >
                Soft (keep staged)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => { doReset(commit.hash, 'mixed'); setShowResetDialog(false) }}
              >
                Mixed (unstage)
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 px-2 text-xs"
                onClick={() => { doReset(commit.hash, 'hard'); setShowResetDialog(false) }}
              >
                Hard (discard all)
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => setShowResetDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className={styles.metadata}>
          <div className={styles.hashRow}>
            <span className={styles.hash}>
              {commit.hash.slice(0, 12)}
            </span>
          </div>
          <h2 className={styles.summary}>
            {commit.summary}
          </h2>
          {commit.message !== commit.summary && (
            <p className={styles.body}>
              {commit.message.slice(commit.summary.length).trim()}
            </p>
          )}
          <div className={styles.metaInfo}>
            <span>Author: {commit.author}</span>
            <span>{new Date(commit.time).toLocaleString()}</span>
          </div>
          {commit.parents.length > 0 && (
            <div className={styles.parents}>
              Parents: {commit.parents.map((p) => p.slice(0, 7)).join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className={styles.diffContainer}>
        {selectedCommitDiff.map((fileDiff, fi) => (
          <div key={fi} className={styles.fileDiff}>
            <div className={styles.filePath}>
              {fileDiff.path}
            </div>
            {fileDiff.isBinary ? (
              <div className={styles.binaryFile}>
                Binary file
              </div>
            ) : (
              <div className={styles.diffContent}>
                {fileDiff.hunks.map((hunk, hi) => (
                  <div key={hi}>
                    <div className={styles.hunkHeader}>
                      @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},
                      {hunk.newRange.count} @@ {hunk.header}
                    </div>
                    {hunk.lines.map((line, li) => (
                      <div
                        key={li}
                        className={`${styles.diffLine} ${line.prefix === '+' ? styles.diffLineAdded : ''} ${line.prefix === '-' ? styles.diffLineDeleted : ''}`}
                      >
                        <span className={styles.linePrefix}>
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
          <p className={styles.emptyDiff}>
            No changes in this commit
          </p>
        )}
      </div>
    </motion.div>
  )
}
