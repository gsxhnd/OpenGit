import { useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import type { FileEntry } from '@shared/types'

function FileRow({
  file,
  onStage,
  onUnstage,
  onDiff,
  onDiscard,
  isStaged,
}: {
  file: FileEntry
  onStage?: () => void
  onUnstage?: () => void
  onDiff?: () => void
  onDiscard?: () => void
  isStaged: boolean
}) {
  const statusColors: Record<string, string> = {
    modified: 'text-warning',
    added: 'text-success',
    deleted: 'text-destructive',
    renamed: 'text-info',
    untracked: 'text-muted-foreground',
    conflicted: 'text-destructive',
  }

  const statusLabels: Record<string, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
    untracked: '?',
    conflicted: 'C',
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 hover:bg-secondary rounded group text-sm">
      <span className={cn('w-4 text-center font-mono text-xs', statusColors[file.status])}>
        {statusLabels[file.status] || ' '}
      </span>
      <span className="flex-1 truncate text-foreground">{file.path}</span>
      <div className="hidden group-hover:flex items-center gap-1">
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
    discardChanges,
    doCommit,
    doAmendCommit,
    commitAmend,
    setCommitAmend,
    loadFileDiff,
    loadStagedFileDiff,
    setView,
  } = useAppStore()

  const [commitMessage, setCommitMessage] = useState('')

  if (!repoStatus) return null

  const { status } = repoStatus
  const unstaged = [...status.unstagedFiles, ...status.untrackedFiles]
  const staged = status.stagedFiles

  const handleCommit = () => {
    if (!commitMessage.trim()) return
    if (commitAmend) {
      doAmendCommit(commitMessage)
    } else {
      doCommit(commitMessage)
    }
    setCommitMessage('')
  }

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
      {/* Unstaged changes */}
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
          {unstaged.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              isStaged={false}
              onStage={() => stageFiles([file.path])}
              onDiff={() => handleDiff(file.path, false)}
              onDiscard={() => discardChanges([file.path])}
            />
          ))}
          {unstaged.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No unstaged changes
            </p>
          )}
        </div>
      </div>

      {/* Staged changes */}
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
          {staged.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              isStaged={true}
              onUnstage={() => unstageFiles([file.path])}
              onDiff={() => handleDiff(file.path, true)}
            />
          ))}
          {staged.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No staged changes
            </p>
          )}
        </div>
      </div>

      {/* Commit form */}
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
