/**
 * CommitDetailView - 提交详情视图
 *
 * 展示单个 commit 的完整信息：
 * - 提交元数据（hash、作者、时间、父提交）
 * - 提交消息（summary + body）
 * - 操作按钮：Cherry-pick、Revert、Reset
 * - 变更文件列表及其 diff 内容
 */
import { useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'

export function CommitDetailView() {
  const {
    selectedCommitDetail,
    selectedCommitDiff,
    goBack,
    doCherryPick,
    revertCommit,
    doReset,
  } = useAppStore()

  // Reset 模式选择对话框
  const [showResetDialog, setShowResetDialog] = useState(false)

  if (!selectedCommitDetail) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No commit selected
      </div>
    )
  }

  const commit = selectedCommitDetail

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* 头部：提交信息 + 操作按钮 */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goBack}
            className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground"
          >
            ← Back
          </button>
          {/* 操作按钮组 */}
          <div className="flex items-center gap-1">
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

        {/* Reset 模式选择 */}
        {showResetDialog && (
          <div className="mb-2 p-2 bg-muted rounded border border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Reset HEAD to <span className="font-mono text-accent">{commit.hash.slice(0, 7)}</span>:
            </p>
            <div className="flex gap-2">
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

        {/* 提交元数据 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent">
              {commit.hash.slice(0, 12)}
            </span>
          </div>
          <h2 className="text-sm font-medium text-foreground">
            {commit.summary}
          </h2>
          {commit.message !== commit.summary && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {commit.message.slice(commit.summary.length).trim()}
            </p>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Author: {commit.author}</span>
            <span>{new Date(commit.time).toLocaleString()}</span>
          </div>
          {commit.parents.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Parents: {commit.parents.map((p) => p.slice(0, 7)).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* 变更文件及 diff 内容 */}
      <div className="flex-1 overflow-y-auto">
        {selectedCommitDiff.map((fileDiff, fi) => (
          <div key={fi} className="border-b border-border">
            {/* 文件路径头 */}
            <div className="px-3 py-1.5 bg-muted text-sm font-mono text-foreground">
              {fileDiff.path}
            </div>
            {fileDiff.isBinary ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Binary file
              </div>
            ) : (
              <div className="font-mono text-xs leading-5">
                {fileDiff.hunks.map((hunk, hi) => (
                  <div key={hi}>
                    <div className="px-3 py-0.5 text-info bg-muted">
                      @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},
                      {hunk.newRange.count} @@ {hunk.header}
                    </div>
                    {hunk.lines.map((line, li) => (
                      <div
                        key={li}
                        className={cn(
                          'px-3 whitespace-pre',
                          line.prefix === '+' &&
                            'bg-diff-added-bg text-diff-added',
                          line.prefix === '-' &&
                            'bg-diff-deleted-bg text-diff-deleted',
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
              </div>
            )}
          </div>
        ))}

        {selectedCommitDiff.length === 0 && (
          <p className="px-3 py-8 text-sm text-muted-foreground text-center">
            No changes in this commit
          </p>
        )}
      </div>
    </motion.div>
  )
}
