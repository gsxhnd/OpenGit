/**
 * Phase 0 — **Activity Bar**：一级功能域（Dashboard / Connections / Sessions / Files / Settings）。
 * 与 `PrimarySidebar` 联动：`/sessions` 与 `/session/:id` 均视为会话域高亮。
 */
import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Folder, LayoutDashboard, MonitorPlay, Plug, Settings } from 'lucide-react'
import { ShellTooltip } from './ShellTooltip'
import styles from './ActivityBar.module.scss'

const items = [
  { to: '/', icon: LayoutDashboard, labelKey: 'workbench.dashboard', end: true },
  { to: '/connections', icon: Plug, labelKey: 'workbench.connections' },
  { to: '/sessions', icon: MonitorPlay, labelKey: 'workbench.sessions' },
  { to: '/files', icon: Folder, labelKey: 'workbench.files' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export function ActivityBar() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <aside className={styles.activityBar} aria-label="Activity Bar">
      {items.map((item) => {
        const Icon = item.icon
        const label = t(item.labelKey)
        return (
          <ShellTooltip key={item.to} content={label} side="right" delay={350}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const active = isActive || (item.to === '/sessions' && location.pathname.startsWith('/session/'))
                return active ? styles.itemActive : styles.item
              }}
              aria-label={label}
            >
              <Icon size={18} />
            </NavLink>
          </ShellTooltip>
        )
      })}
    </aside>
  )
}
