import { useAppStore } from '../store'

export function TitleBar() {
  const { sessions, activeSessionId } = useAppStore()
  const activeSession = sessions.find((s) => s.connectionId === activeSessionId)

  const title = activeSession
    ? `${activeSession.username}@${activeSession.host}`
    : 'Puck'

  return (
    <header className="drag-region flex h-10 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-title-bar)] pl-20 pr-3">
      <div className="pointer-events-none flex min-w-0 items-center gap-2 pl-1">
        <span className="truncate text-sm font-medium text-[var(--color-foreground)]">{title}</span>
        {activeSession && (
          <span className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted-foreground)]">
            SSH
          </span>
        )}
      </div>
    </header>
  )
}
