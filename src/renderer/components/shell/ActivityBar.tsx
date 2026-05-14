/**
 * Phase 0 — **Activity Bar**：一级功能域（Dashboard / Connections / Sessions / Files / Settings）。
 * 与 `PrimarySidebar` 联动：`/sessions` 与 `/session/:id` 均视为会话域高亮。
 * 显示会话计数徽章与快捷键提示。
 */
import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Folder, LayoutDashboard, MonitorPlay, Plug, Settings } from 'lucide-react'
import { useAppStore } from '../../store'
import { ShellTooltip } from './ShellTooltip'
import styles from './ActivityBar.module.scss'

const items = [
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

  return (
    <aside className={styles.activityBar} aria-label="Activity Bar">
      {items.map((item) => {
        const Icon = item.icon
        const label = t(item.labelKey)
        const tooltip = item.shortcut ? `${label} (${item.shortcut})` : label
        const isSessions = item.to === '/sessions'
        const badgeCount = isSessions ? sessions.length : 0

        return (
          <ShellTooltip key={item.to} content={tooltip} side="right" delay={350}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const active = isActive || (item.to === '/sessions' && location.pathname.startsWith('/session/'))
                return active ? styles.itemActive : styles.item
              }}
              aria-label={tooltip}
            >
              <Icon size={18} />
              {badgeCount > 0 ? (
                <span className={styles.badge}>{badgeCount > 9 ? '9+' : badgeCount}</span>
              ) : null}
            </NavLink>
          </ShellTooltip>
        )
      })}
    </aside>
  )
}
