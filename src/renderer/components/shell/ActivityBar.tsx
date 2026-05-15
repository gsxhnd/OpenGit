import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Folder, LayoutDashboard, MonitorPlay, Plug, Settings } from 'lucide-react'
import { useAppStore } from '../../store'
import { cn } from '../../lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'
import { Button } from '../ui/button'

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
  { to: '/settings', icon: Settings, labelKey: 'nav.settings', shortcut: '⌘,' },
]

export function ActivityBar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { sessions } = useAppStore()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <nav
      aria-label="Activity Bar"
      className="group flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-linear"
      style={{ width: collapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)' }}
      data-state={state}
      data-collapsible={collapsed ? 'icon' : ''}
    >
      <SidebarMenu className={cn('flex-1 gap-1 py-2', collapsed ? 'items-center' : 'px-2')}>
        {items.map((item) => {
          const Icon = item.icon
          const label = t(item.labelKey)
          const tooltip = collapsed ? (item.shortcut ? `${label} (${item.shortcut})` : label) : undefined
          const isSessions = item.to === '/sessions'
          const isActive = location.pathname === item.to
            || (isSessions && location.pathname.startsWith('/session/'))
          const badgeCount = isSessions ? sessions.length : 0

          return (
            <SidebarMenuItem key={item.to} className={collapsed ? 'relative flex justify-center' : undefined}>
              <SidebarMenuButton
                render={<NavLink to={item.to} end={item.end} viewTransition />}
                isActive={isActive}
                tooltip={tooltip}
              >
                <Icon />
                {!collapsed && <span>{label}</span>}
              </SidebarMenuButton>
              {badgeCount > 0 && collapsed ? (
                <span className="pointer-events-none absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground tabular-nums leading-none select-none">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              ) : null}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
      <div className="flex shrink-0 justify-end p-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>
    </nav>
  )
}
