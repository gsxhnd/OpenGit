import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

export function TitleBar() {
  const { repoPath, repoStatus, doFetch, doPull, doPush } = useAppStore()

  const repoName = repoPath ? repoPath.split('/').pop() : 'OpenGit'

  return (
    <header
      className={cn(
        'drag-region flex items-center justify-between h-11 px-4',
        'bg-title-bar border-b border-border',
        'select-none'
      )}
    >
      {/* Left: macOS traffic lights spacer + app name */}
      <div className="flex items-center gap-3">
        <div className="w-[68px]" /> {/* Space for traffic lights on macOS */}
        <span className="text-sm font-medium text-foreground">{repoName}</span>
        {repoStatus?.status.currentBranch && (
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            {repoStatus.status.currentBranch}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      {repoPath && (
        <div className="no-drag flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => doFetch()} className="h-7 text-xs">
            Fetch
          </Button>
          <Button variant="ghost" size="sm" onClick={() => doPull()} className="h-7 text-xs">
            Pull
          </Button>
          <Button variant="ghost" size="sm" onClick={() => doPush()} className="h-7 text-xs">
            Push
          </Button>
        </div>
      )}
    </header>
  )
}
