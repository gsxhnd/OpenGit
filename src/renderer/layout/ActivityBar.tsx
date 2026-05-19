import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Folder, LayoutDashboard, MonitorPlay, Plug, Settings } from 'lucide-react'
import { useAppStore } from '@renderer/store'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@renderer/components/ui/sidebar'
import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'

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
  const primaryPanelOpen = useAppStore((s) => s.primaryPanelOpen)

  return (
    <nav
      aria-label="Activity Bar"
      className="group flex shrink-0 flex-col items-center"
      style={{ width: 'var(--activity-bar-width)' }}
      data-state={primaryPanelOpen ? 'expanded' : 'collapsed'}
    >
      {/* Main nav items */}
      <SidebarMenu className="flex-1 gap-0.5 py-1.5 items-center">
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
                size="sm"
                className="size-7! p-1.5!"
                tooltip={tooltip}
                tooltipAlways
              >
                <Icon className="size-[15px]!" />
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
      <div className="flex shrink-0 justify-center pb-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-[var(--color-muted-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-sidebar-foreground)]"
                onClick={() => setSettingsOpen(true)}
                aria-label={t('nav.settings')}
              >
                <Settings size={15} />
              </Button>
            }
          />
          <TooltipContent side="right">{`${t('nav.settings')} (⌘,)`}</TooltipContent>
        </Tooltip>
      </div>
    </nav>
  )
}
