import { useAppStore } from '../store'

export function StatusBar() {
  const { repoStatus } = useAppStore()

  if (!repoStatus) return null

  const { status, ahead, behind } = repoStatus
  const unstagedCount =
    status.unstagedFiles.length + status.untrackedFiles.length
  const stagedCount = status.stagedFiles.length

  return (
    <footer className="flex items-center justify-between h-6 px-3 bg-[var(--color-status-bar)] border-t border-[var(--color-border)] text-[10px] text-[var(--color-muted-foreground)]">
      <div className="flex items-center gap-3">
        {status.currentBranch && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
            </svg>
            {status.currentBranch}
          </span>
        )}
        {(ahead > 0 || behind > 0) && (
          <span>
            {ahead > 0 && `↑${ahead}`}
            {behind > 0 && ` ↓${behind}`}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {unstagedCount > 0 && <span>{unstagedCount} unstaged</span>}
        {stagedCount > 0 && <span>{stagedCount} staged</span>}
        {status.mergeHead && (
          <span className="text-[var(--color-warning)]">MERGING</span>
        )}
      </div>
    </footer>
  )
}
