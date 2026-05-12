import { useAppStore } from '../store'
import { cn } from '../lib/utils'

export function TitleBar() {
  const { repoPath, repoStatus, doFetch, doPull, doPush } = useAppStore()

  const repoName = repoPath ? repoPath.split('/').pop() : 'OpenGit'

  return (
    <header
      className={cn(
        'drag-region flex items-center justify-between h-11 px-4',
        'bg-[var(--color-title-bar)] border-b border-[var(--color-border)]',
        'select-none'
      )}
    >
      {/* Left: macOS traffic lights spacer + app name */}
      <div className="flex items-center gap-3">
        <div className="w-[68px]" /> {/* Space for traffic lights on macOS */}
        <span className="text-sm font-medium text-[var(--color-foreground)]">{repoName}</span>
        {repoStatus?.status.currentBranch && (
          <span className="text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)] px-2 py-0.5 rounded">
            {repoStatus.status.currentBranch}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      {repoPath && (
        <div className="no-drag flex items-center gap-1">
          <button
            onClick={() => doFetch()}
            className="px-3 py-1 text-xs rounded hover:bg-[var(--color-secondary)] text-[var(--color-foreground)] transition-colors"
            title="Fetch"
          >
            Fetch
          </button>
          <button
            onClick={() => doPull()}
            className="px-3 py-1 text-xs rounded hover:bg-[var(--color-secondary)] text-[var(--color-foreground)] transition-colors"
            title="Pull"
          >
            Pull
          </button>
          <button
            onClick={() => doPush()}
            className="px-3 py-1 text-xs rounded hover:bg-[var(--color-secondary)] text-[var(--color-foreground)] transition-colors"
            title="Push"
          >
            Push
          </button>
        </div>
      )}
    </header>
  )
}
