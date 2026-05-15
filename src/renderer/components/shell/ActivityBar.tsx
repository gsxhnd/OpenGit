import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Folder, LayoutDashboard, MonitorPlay, Plug, Settings } from 'lucide-react'
import { useAppStore } from '../../store'
import { cn } from '../../lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'
import { Button } from '../ui/button'
import { ShellTooltip } from './ShellTooltip'

interface ActivityBarItem {
  to: string
  icon: typeof LayoutDashboard
  labelKey: string
  end?: boolean
  shortcut?: string
}

const items: ActivityBarItem[] = [
  { to: '/', icon: LayoutDashboard, labelKey: 'workbench.dashboard', end: true, shortcut: 'Ctrl+Shift+D' },
  { to: '/connections', icon: Plug, labelKey: 'workbench.connections', shortcut: 'Ctrl+Shift+C' },
  { to: '/sessions', icon: MonitorPlay, labelKey: 'workbench.sessions', shortcut: 'Ctrl+Shift+S' },
  { to: '/files', icon: Folder, labelKey: 'workbench.files', shortcut: 'Ctrl+Shift+F' },
]

/**
 * ActivityBar — always icon-only mode (fixed narrow width).
 * Collapse/expand state controls PrimarySidebar visibility, not ActivityBar width.
 */
export function ActivityBar() {
  const { t } = useTranslation()
  const location = useLocation()
  const sessions = useAppStore((s) => s.sessions)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const { state } = useSidebar()

  return (
    <nav
      aria-label="Activity Bar"
      className="group flex shrink-0 flex-col items-center"
      style={{ width: 'var(--sidebar-width-icon)' }}
      data-state={state}
    >
      {/* Main nav items */}
      <SidebarMenu className="flex-1 gap-1 py-2 items-center">
        {items.map((item) => {
          const Icon = item.icon
          const label = t(item.labelKey)
          const tooltip = item.shortcut ? `${label} (${item.shortcut})` : label
          const isSessions = item.to === '/sessions'
          const isActive = location.pathname === item.to
            || (isSessions && location.pathname.startsWith('/session/'))
          const badgeCount = isSessions ? sessions.length : 0

          return (
            <SidebarMenuItem key={item.to} className="relative flex justify-center">
              <SidebarMenuButton
                render={<NavLink to={item.to} end={item.end} viewTransition />}
                isActive={isActive}
                tooltip={tooltip}
              >
                <Icon />
              </SidebarMenuButton>
              {badgeCount > 0 ? (
                <span className="pointer-events-none absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground tabular-nums leading-none select-none">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              ) : null}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>

      {/* Settings button pinned to bottom */}
      <div className="flex shrink-0 justify-center pb-2">
        <ShellTooltip
          content={`${t('nav.settings')} (⌘,)`}
          side="right"
          delay={400}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('nav.settings')}
          >
            <Settings size={16} />
          </Button>
        </ShellTooltip>
      </div>
    </nav>
  )
}
