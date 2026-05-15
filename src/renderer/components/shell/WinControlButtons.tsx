/**
 * WinControlButtons — minimize / maximize / close buttons for Windows & Linux.
 * Shared between MainHeader and SecondPanel header.
 */
import { useEffect, useState, useCallback } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ShellTooltip } from './ShellTooltip'

export function WinControlButtons() {
  const { t } = useTranslation()
  const [isMaximized, setIsMaximized] = useState(false)

  const refreshMaximized = useCallback(async () => {
    const maximized = await (window.api as { isMaximized?: () => Promise<boolean> }).isMaximized?.()
    setIsMaximized(maximized ?? false)
  }, [])

  useEffect(() => {
    void refreshMaximized()
    const unsub = (window.api as { onMaximizedChange?: (cb: (v: boolean) => void) => () => void }).onMaximizedChange?.(
      (v) => setIsMaximized(v),
    )
    return () => unsub?.()
  }, [refreshMaximized])

  const handleMinimize = () => window.api.minimize()
  const handleMaximize = () => window.api.maximize()
  const handleClose = () => window.api.close()

  return (
    <div className="no-drag flex h-full shrink-0 items-stretch">
      <ShellTooltip content={t('titleBar.minimize')} side="bottom" delay={400}>
        <button
          type="button"
          onClick={handleMinimize}
          className="flex h-full w-[46px] items-center justify-center text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
          aria-label={t('titleBar.minimize')}
        >
          <Minus size={14} strokeWidth={1.5} />
        </button>
      </ShellTooltip>
      <ShellTooltip
        content={isMaximized ? t('titleBar.restore') : t('titleBar.maximize')}
        side="bottom"
        delay={400}
      >
        <button
          type="button"
          onClick={handleMaximize}
          className="flex h-full w-[46px] items-center justify-center text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
          aria-label={isMaximized ? t('titleBar.restore') : t('titleBar.maximize')}
        >
          {isMaximized ? <Square size={12} strokeWidth={1.5} /> : <Maximize2 size={12} strokeWidth={1.5} />}
        </button>
      </ShellTooltip>
      <ShellTooltip content={t('titleBar.close')} side="bottom" delay={400}>
        <button
          type="button"
          onClick={handleClose}
          className="flex h-full w-[46px] items-center justify-center text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-destructive)] hover:text-[var(--color-destructive-foreground)]"
          aria-label={t('titleBar.close')}
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </ShellTooltip>
    </div>
  )
}
