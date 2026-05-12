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
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Input } from './ui/input'
import { Search } from 'lucide-react'

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
  const {
    setView,
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

  // 所有可用命令列表
  const commands: Command[] = [
    // 导航类
    {
      id: 'view-commit',
      label: 'Go to Commit View',
      category: 'Navigation',
      action: () => { setView('commit'); setIsOpen(false) },
      shortcut: 'Ctrl+1',
    },
    {
      id: 'view-history',
      label: 'Go to History View',
      category: 'Navigation',
      action: () => { setView('history'); setIsOpen(false) },
      shortcut: 'Ctrl+2',
    },
    {
      id: 'view-branches',
      label: 'Go to Branches View',
      category: 'Navigation',
      action: () => { setView('branches'); setIsOpen(false) },
      shortcut: 'Ctrl+3',
    },
    {
      id: 'view-graph',
      label: 'Go to Graph View',
      category: 'Navigation',
      action: () => { setView('graph'); setIsOpen(false) },
      shortcut: 'Ctrl+4',
    },
    {
      id: 'view-stash',
      label: 'Go to Stash View',
      category: 'Navigation',
      action: () => { setView('stash'); setIsOpen(false) },
    },
    {
      id: 'view-tags',
      label: 'Go to Tags View',
      category: 'Navigation',
      action: () => { setView('tags'); setIsOpen(false) },
    },
    {
      id: 'view-reflog',
      label: 'Go to Reflog View',
      category: 'Navigation',
      action: () => { setView('reflog'); setIsOpen(false) },
    },
    {
      id: 'view-files',
      label: 'Go to File Search',
      category: 'Navigation',
      action: () => { setView('file-search'); setIsOpen(false) },
    },
    {
      id: 'view-projects',
      label: 'Go to Projects',
      category: 'Navigation',
      action: () => { setView('projects'); setIsOpen(false) },
    },
    {
      id: 'view-hooks',
      label: 'Go to Git Hooks',
      category: 'Navigation',
      action: () => { setView('hooks'); setIsOpen(false) },
    },
    {
      id: 'view-settings',
      label: 'Go to Settings',
      category: 'Navigation',
      action: () => { setView('settings'); setIsOpen(false) },
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
            className="fixed inset-0 bg-black/50 z-40"
          />
          {/* 面板主体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
              {/* 搜索输入框 */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Search size={18} className="text-muted-foreground" />
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
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    No commands found
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((cmd, index) => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action()
                          setIsOpen(false)
                        }}
                        className={`w-full px-4 py-2 text-left transition-colors flex items-center justify-between ${
                          index === selectedIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs opacity-70">{cmd.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] opacity-50">{cmd.category}</span>
                          {cmd.shortcut && (
                            <span className="text-xs opacity-50 ml-2">{cmd.shortcut}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部提示 */}
              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
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
