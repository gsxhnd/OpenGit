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
import { cn } from '../lib/utils'
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
    <div className="border border-border rounded overflow-hidden">
      {/* 文件头部 */}
      <div
        className="flex items-center justify-between gap-2 p-2 bg-background cursor-pointer hover:bg-secondary/50"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground">{expanded ? '▼' : '▶'}</span>
          <span className="text-destructive text-xs font-bold">C</span>
          <span className="font-mono text-xs truncate">{file}</span>
        </div>
        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
            className="overflow-hidden border-t border-border"
          >
            {loading ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">Loading diff...</div>
            ) : diffData && diffData.hunks.length > 0 ? (
              <div className="max-h-48 overflow-y-auto font-mono text-[11px] leading-4">
                {diffData.hunks.map((hunk, hi) => (
                  <div key={hi}>
                    <div className="px-3 py-0.5 bg-muted text-info text-[10px]">
                      @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},{hunk.newRange.count} @@
                    </div>
                    {hunk.lines.slice(0, 30).map((line, li) => (
                      <div
                        key={li}
                        className={cn(
                          'px-3 whitespace-pre',
                          line.prefix === '+' && 'bg-diff-added-bg text-diff-added',
                          line.prefix === '-' && 'bg-diff-deleted-bg text-diff-deleted',
                          line.prefix === ' ' && 'text-foreground/70'
                        )}
                      >
                        <span className="inline-block w-3 select-none text-muted-foreground">{line.prefix}</span>
                        {line.content}
                      </div>
                    ))}
                    {hunk.lines.length > 30 && (
                      <div className="px-3 py-1 text-[10px] text-muted-foreground">
                        ... {hunk.lines.length - 30} more lines
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-muted-foreground">No diff available</div>
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
      className="border-b border-destructive/30 bg-destructive/5 p-4"
    >
      {/* 标题和中止按钮 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm text-destructive">
            {operationType} Conflict
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
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
      <div className="space-y-2 max-h-64 overflow-y-auto">
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
