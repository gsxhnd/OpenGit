/**
 * TitleBar — platform-aware title bar.
 *
 * macOS:  hiddenInset mode — native traffic lights on the left, drag region,
 *         title centered. No custom window buttons needed.
 *
 * Windows / Linux:  fully frameless — custom minimize / maximize / close
 *         buttons on the right, app menu button on the left.
 */
import { useEffect, useState, useCallback } from 'react'
import { Minus, Square, X, Maximize2, Menu } from 'lucide-react'
import { useAppStore } from '../store'

const platform = (window.api as { platform?: string }).platform ?? 'linux'
const isMac = platform === 'darwin'

// ---------------------------------------------------------------------------
// macOS title bar
// ---------------------------------------------------------------------------
function MacTitleBar({ title }: { title: string }) {
  return (
    <header
      className="drag-region flex h-[38px] shrink-0 items-center border-b border-[var(--color-border)] bg-[var(--color-title-bar)]"
      style={{ paddingLeft: 76 }}
    >
      {/* Center title */}
      <div className="pointer-events-none flex flex-1 items-center justify-center gap-2 overflow-hidden px-2">
        <span className="truncate text-[13px] font-medium text-[var(--color-foreground)] opacity-80">
          {title}
        </span>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Windows / Linux window control buttons
// ---------------------------------------------------------------------------
function WinControlButtons({ isMaximized }: { isMaximized: boolean }) {
  const handleMinimize = () => window.api.minimize()
  const handleMaximize = () => window.api.maximize()
  const handleClose = () => window.api.close()

  return (
    <div className="no-drag flex h-full shrink-0 items-stretch">
      <button
        onClick={handleMinimize}
        className="flex h-full w-[46px] items-center justify-center text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
        title="Minimize"
        aria-label="Minimize window"
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      <button
        onClick={handleMaximize}
        className="flex h-full w-[46px] items-center justify-center text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
        title={isMaximized ? 'Restore' : 'Maximize'}
        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
      >
        {isMaximized ? <Square size={12} strokeWidth={1.5} /> : <Maximize2 size={12} strokeWidth={1.5} />}
      </button>
      <button
        onClick={handleClose}
        className="flex h-full w-[46px] items-center justify-center text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-destructive)] hover:text-[var(--color-destructive-foreground)]"
        title="Close"
        aria-label="Close window"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Windows / Linux title bar
// ---------------------------------------------------------------------------
function WinTitleBar({ title, isMaximized }: { title: string; isMaximized: boolean }) {
  return (
    <header className="drag-region flex h-[32px] shrink-0 items-stretch border-b border-[var(--color-border)] bg-[var(--color-title-bar)]">
      {/* Left: app menu button */}
      <div className="no-drag flex shrink-0 items-center pl-2 pr-1">
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
          title="Menu"
          aria-label="Application menu"
          onClick={() => {
            // On Windows/Linux the native menu is accessible via Alt key;
            // this button is a visual affordance — clicking it focuses the window
            // so the user can press Alt to open the menu.
          }}
        >
          <Menu size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Center: title */}
      <div className="pointer-events-none flex flex-1 items-center overflow-hidden px-2">
        <span className="truncate text-[12px] font-medium text-[var(--color-foreground)] opacity-70">
          {title}
        </span>
      </div>

      {/* Right: window controls */}
      <WinControlButtons isMaximized={isMaximized} />
    </header>
  )
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------
export function TitleBar() {
  const { sessions, activeSessionId } = useAppStore()
  const activeSession = sessions.find((s) => s.connectionId === activeSessionId)

  const title = activeSession ? `${activeSession.username}@${activeSession.host}` : 'Puck'

  const [isMaximized, setIsMaximized] = useState(false)

  const refreshMaximized = useCallback(async () => {
    if (!isMac) {
      const maximized = await (window.api as { isMaximized?: () => Promise<boolean> }).isMaximized?.()
      setIsMaximized(maximized ?? false)
    }
  }, [])

  useEffect(() => {
    if (isMac) return
    void refreshMaximized()
    const unsub = (window.api as { onMaximizedChange?: (cb: (v: boolean) => void) => () => void }).onMaximizedChange?.(
      (v) => setIsMaximized(v),
    )
    return () => unsub?.()
  }, [refreshMaximized])

  if (isMac) {
    return <MacTitleBar title={title} />
  }

  return <WinTitleBar title={title} isMaximized={isMaximized} />
}
