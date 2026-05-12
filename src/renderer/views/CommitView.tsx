/**
 * CommitView - 提交视图
 *
 * 主要工作区视图，展示未暂存/已暂存的文件变更列表，
 * 支持文件级和 Hunk 级别的暂存/取消暂存操作，
 * 以及提交表单（含 amend 模式）。
 *
 * 功能：
 * - 文件列表展示（状态标识 M/A/D/R/?/C）
 * - 单击文件展开内联 diff 预览（含 hunk 级别操作按钮）
 * - Stage/Unstage 单文件或全部
 * - Discard 丢弃工作区变更
 * - Commit / Amend Commit
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import type { FileEntry, FileDiff, DiffHunk } from '@shared/types'

/**
 * 内联 Hunk 预览组件
 * 在文件行下方展示该文件的 diff hunks，支持逐 hunk 暂存/取消暂存
 */
function InlineHunkPreview({
  diff,
  isStaged,
  onStageHunk,
  onUnstageHunk,
}: {
  diff: FileDiff
  isStaged: boolean
  onStageHunk: (hunkIndex: number) => void
  onUnstageHunk: (hunkIndex: number) => void
}) {
  if (diff.isBinary) {
    return (
      <div className="px-6 py-3 text-xs text-muted-foreground bg-muted/50 border-b border-border">
        Binary file — cannot display diff
      </div>
    )
  }

  if (diff.hunks.length === 0) {
    return (
      <div className="px-6 py-3 text-xs text-muted-foreground bg-muted/50 border-b border-border">
        No changes to display
      </div>
    )
  }

  return (
    <div className="border-b border-border bg-muted/20">
      {diff.hunks.map((hunk, hi) => (
        <div key={hi} className="border-b border-border/50 last:border-b-0">
          {/* Hunk 头部：显示范围信息和操作按钮 */}
          <div className="flex items-center justify-between px-4 py-1 bg-muted/60 text-info text-xs font-mono group">
            <span className="truncate">
              @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},{hunk.newRange.count} @@ {hunk.header}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
              {isStaged ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 px-2 text-[10px] text-warning"
                  onClick={(e) => { e.stopPropagation(); onUnstageHunk(hi) }}
                >
                  Unstage Hunk
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 px-2 text-[10px] text-success"
                  onClick={(e) => { e.stopPropagation(); onStageHunk(hi) }}
                >
                  Stage Hunk
                </Button>
              )}
            </div>
          </div>
          {/* Hunk 内容行 */}
          <div className="font-mono text-[11px] leading-4 max-h-48 overflow-y-auto">
            {hunk.lines.map((line, li) => (
              <div
                key={li}
                className={cn(
                  'px-4 whitespace-pre',
                  line.prefix === '+' && 'bg-diff-added-bg text-diff-added',
                  line.prefix === '-' && 'bg-diff-deleted-bg text-diff-deleted',
                  line.prefix === ' ' && 'text-foreground/80'
                )}
              >
                <span className="inline-block w-3 text-muted-foreground select-none">
                  {line.prefix}
                </span>
                {line.content}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 文件行组件
 * 展示单个文件的状态、路径，以及悬停时的操作按钮
 */
function FileRow({
  file,
  onStage,
  onUnstage,
  onDiff,
  onDiscard,
  isStaged,
  isExpanded,
  onToggleExpand,
}: {
  file: FileEntry
  onStage?: () => void
  onUnstage?: () => void
  onDiff?: () => void
  onDiscard?: () => void
  isStaged: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  // 文件状态对应的颜色
  const statusColors: Record<string, string> = {
    modified: 'text-warning',
    added: 'text-success',
    deleted: 'text-destructive',
    renamed: 'text-info',
    untracked: 'text-muted-foreground',
    conflicted: 'text-destructive',
  }

  // 文件状态对应的简写标签
  const statusLabels: Record<string, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
    untracked: '?',
    conflicted: 'C',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1 hover:bg-secondary rounded group text-sm cursor-pointer',
        isExpanded && 'bg-secondary/50'
      )}
      onClick={onToggleExpand}
    >
      {/* 展开/折叠指示器 */}
      <span className="text-muted-foreground text-xs w-3 flex-shrink-0">
        {isExpanded ? '▼' : '▶'}
      </span>
      {/* 文件状态标识 */}
      <span className={cn('w-4 text-center font-mono text-xs', statusColors[file.status])}>
        {statusLabels[file.status] || ' '}
      </span>
      {/* 文件路径 */}
      <span className="flex-1 truncate text-foreground">{file.path}</span>
      {/* 操作按钮（悬停显示） */}
      <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {onDiff && (
          <Button variant="ghost" size="sm" onClick={onDiff} className="h-6 px-2 text-xs">
            Diff
          </Button>
        )}
        {onDiscard && (
          <Button variant="ghost" size="sm" onClick={onDiscard} className="h-6 px-2 text-xs text-destructive hover:text-destructive">
            Discard
          </Button>
        )}
        {isStaged ? (
          onUnstage && (
            <Button variant="ghost" size="sm" onClick={onUnstage} className="h-6 px-2 text-xs text-warning">
              Unstage
            </Button>
          )
        ) : (
          onStage && (
            <Button variant="ghost" size="sm" onClick={onStage} className="h-6 px-2 text-xs text-success">
              Stage
            </Button>
          )
        )}
      </div>
    </div>
  )
}

export function CommitView() {
  const {
    repoStatus,
    stageFiles,
    unstageFiles,
    stageAll,
    unstageAll,
    stageHunk,
    unstageHunk,
    discardChanges,
    doCommit,
    doAmendCommit,
    commitAmend,
    setCommitAmend,
    loadFileDiff,
    loadStagedFileDiff,
    setView,
    diffPreview,
  } = useAppStore()

  const [commitMessage, setCommitMessage] = useState('')
  // 当前展开的文件路径（用于内联 diff 预览）
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  // 缓存已加载的 diff 数据
  const [inlineDiffs, setInlineDiffs] = useState<Record<string, FileDiff>>({})
  // 标记展开的文件是否为 staged
  const [expandedIsStaged, setExpandedIsStaged] = useState(false)

  if (!repoStatus) return null

  const { status } = repoStatus
  const unstaged = [...status.unstagedFiles, ...status.untrackedFiles]
  const staged = status.stagedFiles

  /**
   * 切换文件的内联 diff 展开/折叠状态
   * 展开时异步加载该文件的 diff 数据
   */
  const toggleExpand = async (path: string, isStaged: boolean) => {
    const key = `${isStaged ? 'staged:' : 'unstaged:'}${path}`
    if (expandedFile === key) {
      setExpandedFile(null)
      return
    }
    setExpandedFile(key)
    setExpandedIsStaged(isStaged)

    // 加载 diff 数据（如果尚未缓存）
    if (!inlineDiffs[key]) {
      try {
        const diff = isStaged
          ? await window.api.getStagedFileDiff(path)
          : await window.api.getFileDiff(path)
        setInlineDiffs((prev) => ({ ...prev, [key]: diff }))
      } catch {
        // 加载失败时静默处理
      }
    }
  }

  const handleCommit = () => {
    if (!commitMessage.trim()) return
    if (commitAmend) {
      doAmendCommit(commitMessage)
    } else {
      doCommit(commitMessage)
    }
    setCommitMessage('')
  }

  /** 在全屏 DiffView 中查看文件 diff */
  const handleDiff = (path: string, isStaged: boolean) => {
    if (isStaged) {
      loadStagedFileDiff(path)
    } else {
      loadFileDiff(path)
    }
    setView('diff')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* 未暂存变更区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Unstaged Changes ({unstaged.length})
          </h3>
          {unstaged.length > 0 && (
            <Button variant="ghost" size="sm" onClick={stageAll} className="h-6 px-2 text-xs text-success">
              Stage All
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {unstaged.map((file) => {
            const key = `unstaged:${file.path}`
            const isExpanded = expandedFile === key
            return (
              <div key={file.path}>
                <FileRow
                  file={file}
                  isStaged={false}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleExpand(file.path, false)}
                  onStage={() => stageFiles([file.path])}
                  onDiff={() => handleDiff(file.path, false)}
                  onDiscard={() => discardChanges([file.path])}
                />
                {/* 内联 diff 预览（展开时显示） */}
                <AnimatePresence>
                  {isExpanded && inlineDiffs[key] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <InlineHunkPreview
                        diff={inlineDiffs[key]}
                        isStaged={false}
                        onStageHunk={(hi) => stageHunk(file.path, hi)}
                        onUnstageHunk={(hi) => unstageHunk(file.path, hi)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          {unstaged.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No unstaged changes
            </p>
          )}
        </div>
      </div>

      {/* 已暂存变更区域 */}
      <div className="flex-1 overflow-hidden flex flex-col border-t border-border">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Staged Changes ({staged.length})
          </h3>
          {staged.length > 0 && (
            <Button variant="ghost" size="sm" onClick={unstageAll} className="h-6 px-2 text-xs text-warning">
              Unstage All
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {staged.map((file) => {
            const key = `staged:${file.path}`
            const isExpanded = expandedFile === key
            return (
              <div key={file.path}>
                <FileRow
                  file={file}
                  isStaged={true}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleExpand(file.path, true)}
                  onUnstage={() => unstageFiles([file.path])}
                  onDiff={() => handleDiff(file.path, true)}
                />
                {/* 内联 diff 预览（展开时显示） */}
                <AnimatePresence>
                  {isExpanded && inlineDiffs[key] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <InlineHunkPreview
                        diff={inlineDiffs[key]}
                        isStaged={true}
                        onStageHunk={(hi) => stageHunk(file.path, hi)}
                        onUnstageHunk={(hi) => unstageHunk(file.path, hi)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          {staged.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No staged changes
            </p>
          )}
        </div>
      </div>

      {/* 提交表单 */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={commitAmend}
              onChange={(e) => setCommitAmend(e.target.checked)}
              className="rounded"
            />
            Amend
          </label>
        </div>
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full h-20 px-3 py-2 text-sm bg-muted border border-border rounded-md resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleCommit()
            }
          }}
        />
        <Button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || staged.length === 0}
          className="mt-2 w-full"
        >
          {commitAmend ? 'Amend Commit' : 'Commit'}
        </Button>
      </div>
    </motion.div>
  )
}
