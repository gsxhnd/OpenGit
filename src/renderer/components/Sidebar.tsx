/**
 * Sidebar - 左侧导航栏
 *
 * 提供主要视图的导航入口，使用动画高亮当前活跃视图。
 * 分为两组：
 * - 主导航：日常高频操作（Commit、History、Branches 等）
 * - 工具导航：管理和配置类功能（Projects、Hooks、Settings）
 */
import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import type { ViewType } from '@shared/types'
import { viewToPath } from '../routes'
import styles from './Sidebar.module.scss'

/** 主导航项 - 日常 Git 操作 */
const NAV_ITEMS: { view: ViewType; label: string; icon: string }[] = [
  { view: 'commit', label: 'Commit', icon: '⊕' },
  { view: 'history', label: 'History', icon: '⏱' },
  { view: 'branches', label: 'Branches', icon: '⑂' },
  { view: 'stash', label: 'Stash', icon: '⊟' },
  { view: 'tags', label: 'Tags', icon: '⊙' },
  { view: 'graph', label: 'Graph', icon: '◈' },
  { view: 'file-search', label: 'Files', icon: '⊘' },
  { view: 'reflog', label: 'Reflog', icon: '↺' },
]

/** 工具导航项 - 管理和配置 */
const TOOL_ITEMS: { view: ViewType; label: string; icon: string }[] = [
  { view: 'projects', label: 'Projects', icon: '⊞' },
  { view: 'hooks', label: 'Hooks', icon: '⚡' },
  { view: 'settings', label: 'Settings', icon: '⚙' },
]

function NavButton({ view, label, icon }: { view: ViewType; label: string; icon: string }) {
  const currentView = useAppStore((s) => s.currentView)

  return (
    <NavLink
      to={viewToPath(view)}
      className={`${styles.navButton} ${currentView === view ? styles.navButtonActive : ''}`}
    >
      {currentView === view && (
        <motion.div
          layoutId="sidebar-active"
          className={styles.navButtonBg}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
        />
      )}
      <span className={styles.navIcon}>{icon}</span>
      <span className={styles.navLabel}>{label}</span>
    </NavLink>
  )
}

function ToolButton({ view, label, icon }: { view: ViewType; label: string; icon: string }) {
  const currentView = useAppStore((s) => s.currentView)

  return (
    <NavLink
      to={viewToPath(view)}
      className={`${styles.toolButton} ${currentView === view ? styles.toolButtonActive : ''}`}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.view} view={item.view} label={item.label} icon={item.icon} />
        ))}
      </nav>

      <div className={styles.toolSection}>
        {TOOL_ITEMS.map((item) => (
          <ToolButton key={item.view} view={item.view} label={item.label} icon={item.icon} />
        ))}
      </div>
    </aside>
  )
}
