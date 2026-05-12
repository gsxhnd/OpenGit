/**
 * Sidebar - 左侧导航栏
 *
 * 提供主要视图的导航入口，使用动画高亮当前活跃视图。
 * 分为两组：
 * - 主导航：日常高频操作（Commit、History、Branches 等）
 * - 工具导航：管理和配置类功能（Projects、Hooks、Settings）
 */
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import type { ViewType } from '@shared/types'
import { cn } from '../lib/utils'

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

export function Sidebar() {
  const { currentView, setView } = useAppStore()

  return (
    <aside className="w-48 flex-shrink-0 bg-sidebar border-r border-border flex flex-col overflow-y-auto">
      {/* 主导航 */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors',
              currentView === item.view
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {currentView === item.view && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-secondary rounded"
                transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 w-4 text-center">{item.icon}</span>
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 分隔线 + 工具导航 */}
      <div className="border-t border-border p-2">
        {TOOL_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors w-full',
              currentView === item.view
                ? 'text-foreground bg-secondary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <span className="w-4 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
