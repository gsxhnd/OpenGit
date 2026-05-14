import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Folder, LayoutDashboard, MonitorPlay, Plug, Settings } from 'lucide-react'
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
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => {
              const active = isActive || (item.to === '/sessions' && location.pathname.startsWith('/session/'))
              return active ? styles.itemActive : styles.item
            }}
            title={t(item.labelKey)}
          >
            <Icon size={18} />
          </NavLink>
        )
      })}
    </aside>
  )
}
