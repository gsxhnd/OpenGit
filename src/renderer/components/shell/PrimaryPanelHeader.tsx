/**
 * PrimaryPanelHeader — header for the Primary Panel (ActivityBar + Sidebar).
 *
 * macOS:  traffic-light space (76px left padding) + collapse toggle on the right.
 *         When collapsed, only shows the collapse toggle centered (no padding).
 * Win/Linux: AppMenubar on the left + collapse toggle on the right.
 *         When collapsed, only shows the collapse toggle centered (menubar hidden).
 *
 * Height matches MainHeader: macOS 38px, Win/Linux 32px.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '../ui/sidebar'
import { Button } from '../ui/button'
import { AppMenubar } from './AppMenubar'
import { ShellTooltip } from './ShellTooltip'

const isMac = (window.api as { platform?: string }).platform === 'darwin'

export function PrimaryPanelHeader() {
  const { t } = useTranslation()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  const height = isMac ? 'h-[38px]' : 'h-[32px]'

  // When collapsed, the header is narrow (icon-width only) — just show the toggle centered
  if (collapsed) {
    return (
      <header
        className={`drag-region flex shrink-0 items-center justify-center border-b border-[var(--color-border)] ${height}`}
      >
        <div className="no-drag">
          <ShellTooltip
            content={t('workbench.expandSidebar')}
            side="bottom"
            delay={400}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label={t('workbench.expandSidebar')}
            >
              <ChevronRight size={14} />
            </Button>
          </ShellTooltip>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`drag-region flex shrink-0 items-center border-b border-[var(--color-border)] ${height}`}
      style={isMac ? { paddingLeft: 76 } : undefined}
    >
      {/* Win/Linux: custom menubar */}
      {!isMac && (
        <div className="no-drag flex shrink-0 items-center pl-1">
          <AppMenubar />
        </div>
      )}

      {/* Spacer — pushes collapse toggle to the right */}
      <div className="flex-1" />

      {/* Collapse toggle */}
      <div className="no-drag flex shrink-0 items-center pr-1">
        <ShellTooltip
          content={t('workbench.collapseSidebar')}
          side="bottom"
          delay={400}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label={t('workbench.collapseSidebar')}
          >
            <ChevronLeft size={14} />
          </Button>
        </ShellTooltip>
      </div>
    </header>
  )
}
