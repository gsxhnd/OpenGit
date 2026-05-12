import { useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
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
    modified: 'text-[var(--color-warning)]',
    added: 'text-[var(--color-success)]',
    deleted: 'text-[var(--color-danger)]',
    renamed: 'text-[var(--color-info)]',
    untracked: 'text-[var(--color-muted-foreground)]',
    conflicted: 'text-[var(--color-danger)]',
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
    <div className="flex items-center gap-2 px-3 py-1 hover:bg-[var(--color-secondary)] rounded group text-sm">
      <span className={cn('w-4 text-center font-mono text-xs', statusColors[file.status])}>
        {statusLabels[file.status] || ' '}
      </span>
      <span className="flex-1 truncate text-[var(--color-foreground)]">{file.path}</span>
      <div className="hidden group-hover:flex items-center gap-1">
        {onDiff && (
          <button
            onClick={onDiff}
            className="px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"
          >
            Diff
          </button>
        )}
        {onDiscard && (
          <button
            onClick={onDiscard}
            className="px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-danger)]"
          >
            Discard
          </button>
        )}
        {isStaged ? (
          onUnstage && (
            <button
              onClick={onUnstage}
              className="px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-warning)]"
            >
              Unstage
            </button>
          )
        ) : (
          onStage && (
            <button
              onClick={onStage}
              className="px-2 py-0.5 text-xs rounded bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] text-[var(--color-success)]"
            >
              Stage
            </button>
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
    diffPreview,
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
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
          <h3 className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
            Unstaged Changes ({unstaged.length})
          </h3>
          {unstaged.length > 0 && (
            <button
              onClick={stageAll}
              className="text-xs px-2 py-0.5 rounded hover:bg-[var(--color-secondary)] text-[var(--color-success)]"
            >
              Stage All
            </button>
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
            <p className="px-3 py-4 text-sm text-[var(--color-muted-foreground)] text-center">
              No unstaged changes
            </p>
          )}
        </div>
      </div>

      {/* Staged changes */}
      <div className="flex-1 overflow-hidden flex flex-col border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
          <h3 className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
            Staged Changes ({staged.length})
          </h3>
          {staged.length > 0 && (
            <button
              onClick={unstageAll}
              className="text-xs px-2 py-0.5 rounded hover:bg-[var(--color-secondary)] text-[var(--color-warning)]"
            >
              Unstage All
            </button>
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
            <p className="px-3 py-4 text-sm text-[var(--color-muted-foreground)] text-center">
              No staged changes
            </p>
          )}
        </div>
      </div>

      {/* Commit form */}
      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] cursor-pointer">
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
          className="w-full h-20 px-3 py-2 text-sm bg-[var(--color-muted)] border border-[var(--color-input-border)] rounded-md resize-none text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleCommit()
            }
          }}
        />
        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || staged.length === 0}
          className="mt-2 w-full py-1.5 text-sm font-medium rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {commitAmend ? 'Amend Commit' : 'Commit'}
        </button>
      </div>
    </motion.div>
  )
}
