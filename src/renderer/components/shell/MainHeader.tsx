/**
 * MainHeader — header for the Main Panel.
 *
 * Contains: title (current connection or "Puck"), command palette button,
 * Second Panel toggle.
 *
 * Win/Linux window controls only appear here when SecondPanel is closed.
 * When SecondPanel is open, window controls move to SecondPanel's header.
 *
 * Height: macOS 38px, Win/Linux 32px.
 */
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../store'
import { SecondPanelToggle } from './SecondPanelToggle'
import { ShellTooltip } from './ShellTooltip'
import { WinControlButtons } from './WinControlButtons'

const isMac = (window.api as { platform?: string }).platform === 'darwin'

interface MainHeaderProps {
  onOpenCommandPalette?: () => void
}

export function MainHeader({ onOpenCommandPalette }: MainHeaderProps = {}) {
  const { t } = useTranslation()
  const { sessions, activeSessionId, secondPanelOpen } = useAppStore(
    useShallow((s) => ({
      sessions: s.sessions,
      activeSessionId: s.activeSessionId,
      secondPanelOpen: s.secondPanelOpen,
    })),
  )
  const activeSession = sessions.find((s) => s.connectionId === activeSessionId)
  const title = activeSession ? `${activeSession.username}@${activeSession.host}` : 'Puck'

  const height = isMac ? 'h-[38px]' : 'h-[32px]'
  const iconSize = isMac ? 15 : 13

  // Win/Linux: show window controls here only when SecondPanel is closed
  const showWinControls = !isMac && !secondPanelOpen

  return (
    <header
      className={`drag-region flex shrink-0 items-stretch border-b border-[var(--color-border)] bg-[var(--color-title-bar)] ${height}`}
    >
      {/* Title */}
      <div className="pointer-events-none flex flex-1 items-center overflow-hidden px-3">
        <span className="truncate text-[13px] font-medium text-[var(--color-foreground)] opacity-80">
          {title}
        </span>
      </div>

      {/* Right actions */}
      <div className="no-drag flex shrink-0 items-center gap-0.5 pr-1">
        <SecondPanelToggle className={isMac ? 'h-7 w-7' : 'h-6 w-6'} iconSize={iconSize} />
        {onOpenCommandPalette ? (
          <ShellTooltip content={t('workbench.status.commandPalette')} side="bottom" delay={400}>
            <button
              type="button"
              className={`flex items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] ${isMac ? 'h-7 w-7' : 'h-6 w-6'}`}
              onClick={onOpenCommandPalette}
              aria-label={t('workbench.status.commandPalette')}
            >
              <Search size={iconSize} strokeWidth={1.5} />
            </button>
          </ShellTooltip>
        ) : null}
      </div>

      {/* Win/Linux window controls — only when SecondPanel is closed */}
      {showWinControls && <WinControlButtons />}
    </header>
  )
}
