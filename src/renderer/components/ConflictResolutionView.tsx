/**
 * ConflictResolutionView - 冲突解决视图
 *
 * 当仓库处于合并/变基冲突状态时，在主视图顶部显示冲突提示栏。
 * 列出所有冲突文件，提供 "Keep Ours" / "Keep Theirs" 快速解决按钮，
 * 以及 "Abort Merge" / "Abort Rebase" 中止操作按钮。
 *
 * 支持展开单个冲突文件查看 diff 预览，帮助用户做出解决决策。
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from './ui/button'
import styles from './ConflictResolutionView.module.scss'
import type { FileDiff } from '@shared/types'

/**
 * 单个冲突文件行组件
 * 支持展开查看 diff 内容
 */
function ConflictFileRow({
  file,
  onResolveOurs,
  onResolveTheirs,
}: {
  file: string
  onResolveOurs: () => void
  onResolveTheirs: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [diffData, setDiffData] = useState<FileDiff | null>(null)
  const [loading, setLoading] = useState(false)

  /** 展开时加载冲突文件的 diff */
  const handleToggle = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (!diffData) {
      setLoading(true)
      try {
        const diff = await window.api.getFileDiff(file)
        setDiffData(diff)
      } catch {
        // 加载失败时静默处理
      }
      setLoading(false)
    }
  }

  return (
    <div className={styles.fileRow}>
      {/* 文件头部 */}
      <div
        className={styles.fileHeader}
        onClick={handleToggle}
      >
        <div className={styles.fileInfo}>
          <span className={styles.expandIcon}>{expanded ? '▼' : '▶'}</span>
          <span className={styles.conflictBadge}>C</span>
          <span className={styles.fileName}>{file}</span>
        </div>
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs border-success/50 text-success hover:bg-success/10"
            onClick={onResolveOurs}
          >
            Keep Ours
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs border-info/50 text-info hover:bg-info/10"
            onClick={onResolveTheirs}
          >
            Keep Theirs
          </Button>
        </div>
      </div>

      {/* 展开的 diff 预览 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={styles.diffPanel}
          >
            {loading ? (
              <div className={styles.loadingText}>Loading diff...</div>
            ) : diffData && diffData.hunks.length > 0 ? (
              <div className={styles.diffContent}>
                {diffData.hunks.map((hunk, hi) => (
                  <div key={hi}>
                    <div className={styles.hunkHeader}>
                      @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},{hunk.newRange.count} @@
                    </div>
                    {hunk.lines.slice(0, 30).map((line, li) => (
                      <div
                        key={li}
                        className={`${styles.diffLine} ${
                          line.prefix === '+' ? styles.diffLineAdded :
                          line.prefix === '-' ? styles.diffLineDeleted :
                          line.prefix === ' ' ? styles.diffLineContext : ''
                        }`}
                      >
                        <span className={styles.linePrefix}>{line.prefix}</span>
                        {line.content}
                      </div>
                    ))}
                    {hunk.lines.length > 30 && (
                      <div className={styles.moreLines}>
                        ... {hunk.lines.length - 30} more lines
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noDiff}>No diff available</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ConflictResolutionView() {
  const { conflictFiles, resolveConflict, abortMerge, rebaseAbort, repoStatus } = useAppStore()

  // 仅在存在合并冲突或变基冲突时显示
  const isMerging = !!repoStatus?.status.mergeHead
  const isRebasing = !!repoStatus?.status.rebaseMerge

  if (!isMerging && !isRebasing) {
    return null
  }

  // 如果没有冲突文件但处于合并/变基状态，也不显示
  if (conflictFiles.length === 0) {
    return null
  }

  const operationType = isRebasing ? 'Rebase' : 'Merge'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.container}
    >
      {/* 标题和中止按钮 */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            {operationType} Conflict
          </h3>
          <p className={styles.subtitle}>
            {conflictFiles.length} file(s) have conflicts. Resolve each file to continue.
          </p>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="h-7 px-3 text-xs"
          onClick={isRebasing ? rebaseAbort : abortMerge}
        >
          Abort {operationType}
        </Button>
      </div>

      {/* 冲突文件列表 */}
      <div className={styles.fileList}>
        {conflictFiles.map((file) => (
          <ConflictFileRow
            key={file}
            file={file}
            onResolveOurs={() => resolveConflict(file, 'ours')}
            onResolveTheirs={() => resolveConflict(file, 'theirs')}
          />
        ))}
      </div>
    </motion.div>
  )
}
