/**
 * CommandPalette - 命令面板
 *
 * 通过 Ctrl+Shift+P (macOS: Cmd+Shift+P) 打开的全局命令面板。
 * 提供快速访问所有应用功能的搜索式界面。
 *
 * 功能：
 * - 模糊搜索命令（按名称、描述、分类）
 * - 键盘导航（↑↓ 选择，Enter 执行，Esc 关闭）
 * - 显示快捷键提示
 * - 按分类组织命令
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { viewToPath } from '../routes'
import { Input } from './ui/input'
import { Search } from 'lucide-react'
import styles from './CommandPalette.module.scss'

export interface Command {
  id: string
  label: string
  description?: string
  category: string
  action: () => void
  shortcut?: string
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const {
    stageAll,
    unstageAll,
    doFetch,
    doPull,
    doPush,
    loadHistory,
    loadGraph,
    loadReflog,
    loadTags,
    loadStashes,
    repoPath,
    closeRepo,
  } = useAppStore()

  const commands: Command[] = [
    // 导航类
    {
      id: 'view-commit',
      label: 'Go to Commit View',
      category: 'Navigation',
      action: () => { navigate(viewToPath('commit')); setIsOpen(false) },
      shortcut: 'Ctrl+1',
    },
    {
      id: 'view-history',
      label: 'Go to History View',
      category: 'Navigation',
      action: () => { navigate(viewToPath('history')); setIsOpen(false) },
      shortcut: 'Ctrl+2',
    },
    {
      id: 'view-branches',
      label: 'Go to Branches View',
      category: 'Navigation',
      action: () => { navigate(viewToPath('branches')); setIsOpen(false) },
      shortcut: 'Ctrl+3',
    },
    {
      id: 'view-graph',
      label: 'Go to Graph View',
      category: 'Navigation',
      action: () => { navigate(viewToPath('graph')); setIsOpen(false) },
      shortcut: 'Ctrl+4',
    },
    {
      id: 'view-stash',
      label: 'Go to Stash View',
      category: 'Navigation',
      action: () => { navigate(viewToPath('stash')); setIsOpen(false) },
    },
    {
      id: 'view-tags',
      label: 'Go to Tags View',
      category: 'Navigation',
      action: () => { navigate(viewToPath('tags')); setIsOpen(false) },
    },
    {
      id: 'view-reflog',
      label: 'Go to Reflog View',
      category: 'Navigation',
      action: () => { navigate(viewToPath('reflog')); setIsOpen(false) },
    },
    {
      id: 'view-files',
      label: 'Go to File Search',
      category: 'Navigation',
      action: () => { navigate(viewToPath('file-search')); setIsOpen(false) },
    },
    {
      id: 'view-projects',
      label: 'Go to Projects',
      category: 'Navigation',
      action: () => { navigate(viewToPath('projects')); setIsOpen(false) },
    },
    {
      id: 'view-hooks',
      label: 'Go to Git Hooks',
      category: 'Navigation',
      action: () => { navigate(viewToPath('hooks')); setIsOpen(false) },
    },
    {
      id: 'view-settings',
      label: 'Go to Settings',
      category: 'Navigation',
      action: () => { navigate(viewToPath('settings')); setIsOpen(false) },
    },
    // 暂存类
    {
      id: 'stage-all',
      label: 'Stage All Changes',
      category: 'Staging',
      action: () => { stageAll(); setIsOpen(false) },
      shortcut: 'Ctrl+Shift+A',
    },
    {
      id: 'unstage-all',
      label: 'Unstage All Changes',
      category: 'Staging',
      action: () => { unstageAll(); setIsOpen(false) },
      shortcut: 'Ctrl+Shift+U',
    },
    // 远程操作类
    {
      id: 'fetch',
      label: 'Fetch from Remote',
      description: 'Download objects and refs from remote',
      category: 'Remote',
      action: () => { doFetch(); setIsOpen(false) },
    },
    {
      id: 'pull',
      label: 'Pull from Remote',
      description: 'Fetch and integrate remote changes',
      category: 'Remote',
      action: () => { doPull(); setIsOpen(false) },
    },
    {
      id: 'push',
      label: 'Push to Remote',
      description: 'Upload local commits to remote',
      category: 'Remote',
      action: () => { doPush(); setIsOpen(false) },
    },
    // 数据加载类
    {
      id: 'refresh-history',
      label: 'Refresh History',
      category: 'Data',
      action: () => { loadHistory(); setIsOpen(false) },
    },
    {
      id: 'refresh-graph',
      label: 'Refresh Graph',
      category: 'Data',
      action: () => { loadGraph(); setIsOpen(false) },
    },
    {
      id: 'refresh-tags',
      label: 'Refresh Tags',
      category: 'Data',
      action: () => { loadTags(); setIsOpen(false) },
    },
    {
      id: 'refresh-stashes',
      label: 'Refresh Stashes',
      category: 'Data',
      action: () => { loadStashes(); setIsOpen(false) },
    },
    // 仓库操作
    {
      id: 'close-repo',
      label: 'Close Repository',
      description: 'Close current repository and return to welcome',
      category: 'Repository',
      action: () => { closeRepo(); setIsOpen(false) },
    },
  ]

  // 根据搜索词过滤命令
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
  )

  // 监听全局快捷键打开/关闭面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setIsOpen(!isOpen)
        setSearch('')
        setSelectedIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 面板内键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => (i + 1) % filteredCommands.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands])

  if (!repoPath) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className={styles.overlay}
          />
          {/* 面板主体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={styles.panel}
          >
            <div className={styles.container}>
              {/* 搜索输入框 */}
              <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <Input
                  autoFocus
                  placeholder="Type a command..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedIndex(0)
                  }}
                  className="border-0 focus-visible:ring-0 text-base"
                />
              </div>

              {/* 命令列表 */}
              <div className={styles.commandList}>
                {filteredCommands.length === 0 ? (
                  <div className={styles.emptyState}>
                    No commands found
                  </div>
                ) : (
                  <div className={styles.commandGroup}>
                    {filteredCommands.map((cmd, index) => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action()
                          setIsOpen(false)
                        }}
                        className={`${styles.commandItem}${index === selectedIndex ? ` ${styles.selected}` : ''}`}
                      >
                        <div>
                          <div className={styles.commandLabel}>{cmd.label}</div>
                          {cmd.description && (
                            <div className={styles.commandDescription}>{cmd.description}</div>
                          )}
                        </div>
                        <div className={styles.commandMeta}>
                          <span className={styles.commandCategory}>{cmd.category}</span>
                          {cmd.shortcut && (
                            <span className={styles.commandShortcut}>{cmd.shortcut}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部提示 */}
              <div className={styles.footer}>
                <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
                <span>{filteredCommands.length} commands</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
