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
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import type { FileEntry, FileDiff, DiffHunk } from '@shared/types'
import styles from './CommitView.module.scss'

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
      <div className={styles.binaryMessage}>
        Binary file — cannot display diff
      </div>
    )
  }

  if (diff.hunks.length === 0) {
    return (
      <div className={styles.emptyMessage}>
        No changes to display
      </div>
    )
  }

  return (
    <div className={styles.hunkContainer}>
      {diff.hunks.map((hunk, hi) => (
        <div key={hi} className={styles.hunkBlock}>
          {/* Hunk 头部：显示范围信息和操作按钮 */}
          <div className={styles.hunkHeader}>
            <span className={styles.hunkHeaderRange}>
              @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},{hunk.newRange.count} @@ {hunk.header}
            </span>
            <div className={styles.hunkActions}>
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
          <div className={styles.hunkLines}>
            {hunk.lines.map((line, li) => {
              const lineClass = line.prefix === '+'
                ? `${styles.hunkLine} ${styles.hunkLineAdded}`
                : line.prefix === '-'
                  ? `${styles.hunkLine} ${styles.hunkLineDeleted}`
                  : `${styles.hunkLine} ${styles.hunkLineContext}`
              return (
                <div key={li} className={lineClass}>
                  <span className={styles.linePrefix}>
                    {line.prefix}
                  </span>
                  {line.content}
                </div>
              )
            })}
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
  // 文件状态对应的样式类
  const statusStyleMap: Record<string, string> = {
    modified: styles.statusModified,
    added: styles.statusAdded,
    deleted: styles.statusDeleted,
    renamed: styles.statusRenamed,
    untracked: styles.statusUntracked,
    conflicted: styles.statusConflicted,
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
      className={`${styles.fileRow} ${isExpanded ? styles.fileRowExpanded : ''}`}
      onClick={onToggleExpand}
    >
      {/* 展开/折叠指示器 */}
      <span className={styles.expandIndicator}>
        {isExpanded ? '▼' : '▶'}
      </span>
      {/* 文件状态标识 */}
      <span className={`${styles.statusBadge} ${statusStyleMap[file.status] || ''}`}>
        {statusLabels[file.status] || ' '}
      </span>
      {/* 文件路径 */}
      <span className={styles.filePath}>{file.path}</span>
      {/* 操作按钮（悬停显示） */}
      <div className={styles.fileActions} onClick={(e) => e.stopPropagation()}>
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
    diffPreview,
  } = useAppStore()

  const navigate = useNavigate()
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
    navigate('/diff')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      {/* 未暂存变更区域 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            Unstaged Changes ({unstaged.length})
          </h3>
          {unstaged.length > 0 && (
            <Button variant="ghost" size="sm" onClick={stageAll} className="h-6 px-2 text-xs text-success">
              Stage All
            </Button>
          )}
        </div>
        <div className={styles.fileList}>
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
                      className={styles.overflowHidden}
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
            <p className={styles.emptyState}>
              No unstaged changes
            </p>
          )}
        </div>
      </div>

      {/* 已暂存变更区域 */}
      <div className={`${styles.section} ${styles.sectionStaged}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            Staged Changes ({staged.length})
          </h3>
          {staged.length > 0 && (
            <Button variant="ghost" size="sm" onClick={unstageAll} className="h-6 px-2 text-xs text-warning">
              Unstage All
            </Button>
          )}
        </div>
        <div className={styles.fileList}>
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
                      className={styles.overflowHidden}
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
            <p className={styles.emptyState}>
              No staged changes
            </p>
          )}
        </div>
      </div>

      {/* 提交表单 */}
      <div className={styles.commitForm}>
        <div className={styles.amendRow}>
          <label className={styles.amendLabel}>
            <input
              type="checkbox"
              checked={commitAmend}
              onChange={(e) => setCommitAmend(e.target.checked)}
              className={styles.amendCheckbox}
            />
            Amend
          </label>
        </div>
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className={styles.commitTextarea}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleCommit()
            }
          }}
        />
        <Button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || staged.length === 0}
          className={styles.commitButton}
        >
          {commitAmend ? 'Amend Commit' : 'Commit'}
        </Button>
      </div>
    </motion.div>
  )
}
