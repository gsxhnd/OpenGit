/**
 * HooksView - Git Hooks 管理视图
 *
 * Phase 6 功能：管理仓库的 Git Hooks。
 * 提供以下能力：
 * - 列出所有可用的 Git Hook 类型
 * - 显示每个 Hook 的启用/禁用状态
 * - 查看 Hook 脚本内容
 * - 启用/禁用 Hook（通过重命名文件添加/移除 .disabled 后缀）
 * - 创建新的 Hook 脚本（使用模板）
 *
 * Git Hooks 存储在 .git/hooks/ 目录下，
 * 可执行文件为启用状态，.sample 后缀为模板。
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'

/** 所有标准 Git Hook 类型 */
const HOOK_TYPES = [
  { name: 'pre-commit', description: 'Run before a commit is created' },
  { name: 'prepare-commit-msg', description: 'Edit the default commit message' },
  { name: 'commit-msg', description: 'Validate or modify commit message' },
  { name: 'post-commit', description: 'Run after a commit is created' },
  { name: 'pre-rebase', description: 'Run before rebase starts' },
  { name: 'post-rewrite', description: 'Run after commands that rewrite commits' },
  { name: 'post-checkout', description: 'Run after checkout/switch' },
  { name: 'post-merge', description: 'Run after a merge completes' },
  { name: 'pre-push', description: 'Run before push to remote' },
  { name: 'pre-auto-gc', description: 'Run before automatic garbage collection' },
] as const

interface HookInfo {
  name: string
  description: string
  exists: boolean
  enabled: boolean
  content: string | null
}

export function HooksView() {
  const { repoPath, goBack, addToast } = useAppStore()
  const [hooks, setHooks] = useState<HookInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedHook, setExpandedHook] = useState<string | null>(null)
  const [editingHook, setEditingHook] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  /** 加载所有 Hook 的状态 */
  const loadHooks = async () => {
    if (!repoPath) return
    setLoading(true)
    try {
      const hookInfos = await window.api.getHooks()
      setHooks(hookInfos)
    } catch (err: any) {
      addToast(`Failed to load hooks: ${err.message}`, 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadHooks()
  }, [repoPath])

  /** 切换 Hook 启用/禁用状态 */
  const handleToggleHook = async (hookName: string, currentlyEnabled: boolean) => {
    try {
      await window.api.toggleHook(hookName, !currentlyEnabled)
      await loadHooks()
      addToast(
        `Hook '${hookName}' ${!currentlyEnabled ? 'enabled' : 'disabled'}`,
        'success'
      )
    } catch (err: any) {
      addToast(`Failed to toggle hook: ${err.message}`, 'error')
    }
  }

  /** 保存 Hook 脚本内容 */
  const handleSaveHook = async (hookName: string) => {
    try {
      await window.api.saveHook(hookName, editContent)
      setEditingHook(null)
      await loadHooks()
      addToast(`Hook '${hookName}' saved`, 'success')
    } catch (err: any) {
      addToast(`Failed to save hook: ${err.message}`, 'error')
    }
  }

  /** 删除 Hook 脚本 */
  const handleDeleteHook = async (hookName: string) => {
    try {
      await window.api.deleteHook(hookName)
      await loadHooks()
      addToast(`Hook '${hookName}' deleted`, 'success')
    } catch (err: any) {
      addToast(`Failed to delete hook: ${err.message}`, 'error')
    }
  }

  /** 创建新 Hook（使用默认模板） */
  const handleCreateHook = (hookName: string) => {
    const template = `#!/bin/sh\n# ${hookName} hook\n# This hook is called ${HOOK_TYPES.find(h => h.name === hookName)?.description?.toLowerCase() || ''}\n\n# Add your commands here\nexit 0\n`
    setEditContent(template)
    setEditingHook(hookName)
    setExpandedHook(hookName)
  }

  if (!repoPath) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Open a repository to manage hooks
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground"
          >
            ← Back
          </button>
          <h1 className="text-base font-semibold">Git Hooks</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          .git/hooks/
        </p>
      </div>

      {/* Hook 列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Loading hooks...</p>
          </div>
        ) : (
          <div>
            {HOOK_TYPES.map((hookType) => {
              const hookInfo = hooks.find((h) => h.name === hookType.name)
              const exists = hookInfo?.exists || false
              const enabled = hookInfo?.enabled || false
              const isExpanded = expandedHook === hookType.name
              const isEditing = editingHook === hookType.name

              return (
                <div key={hookType.name} className="border-b border-border">
                  {/* Hook 行 */}
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary cursor-pointer group"
                    onClick={() => setExpandedHook(isExpanded ? null : hookType.name)}
                  >
                    {/* 展开指示器 */}
                    <span className="text-xs text-muted-foreground w-3">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    {/* 状态指示器 */}
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        enabled ? 'bg-success' : exists ? 'bg-warning' : 'bg-muted-foreground/30'
                      }`}
                      title={enabled ? 'Enabled' : exists ? 'Disabled' : 'Not created'}
                    />
                    {/* Hook 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-foreground">
                          {hookType.name}
                        </span>
                        {exists && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            enabled
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                          }`}>
                            {enabled ? 'Active' : 'Disabled'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hookType.description}
                      </p>
                    </div>
                    {/* 操作按钮 */}
                    <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {exists ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-6 px-2 text-xs ${enabled ? 'text-warning' : 'text-success'}`}
                            onClick={() => handleToggleHook(hookType.name, enabled)}
                          >
                            {enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-destructive"
                            onClick={() => handleDeleteHook(hookType.name)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-success"
                          onClick={() => handleCreateHook(hookType.name)}
                        >
                          Create
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 展开内容：脚本预览/编辑 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden border-t border-border/50"
                      >
                        {isEditing ? (
                          /* 编辑模式 */
                          <div className="p-3 bg-muted/30">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full h-48 px-3 py-2 font-mono text-xs bg-background border border-border rounded resize-y text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              spellCheck={false}
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => handleSaveHook(hookType.name)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-3 text-xs"
                                onClick={() => setEditingHook(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : exists && hookInfo?.content ? (
                          /* 预览模式 */
                          <div className="p-3 bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">Script content:</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  setEditContent(hookInfo.content || '')
                                  setEditingHook(hookType.name)
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                            <pre className="font-mono text-[11px] leading-4 p-3 bg-background border border-border rounded max-h-48 overflow-y-auto text-foreground whitespace-pre-wrap">
                              {hookInfo.content}
                            </pre>
                          </div>
                        ) : !exists ? (
                          /* 未创建状态 */
                          <div className="p-4 bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground mb-2">
                              This hook has not been created yet.
                            </p>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-xs"
                              onClick={() => handleCreateHook(hookType.name)}
                            >
                              Create Hook
                            </Button>
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
