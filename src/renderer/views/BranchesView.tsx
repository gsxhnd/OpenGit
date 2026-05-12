/**
 * BranchesView - 分支管理视图
 *
 * 提供完整的分支和远程仓库管理功能：
 * - 创建/删除/切换本地分支
 * - 查看远程分支
 * - 管理远程仓库（添加/删除）
 * - Merge 分支合并
 * - Rebase 变基操作（含 continue/abort）
 *
 * 布局：创建区 → 本地分支列表 → 远程分支列表 → 远程仓库管理
 */
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'

export function BranchesView() {
  const {
    repoStatus,
    createBranch,
    deleteBranch,
    switchBranch,
    doMerge,
    doRebase,
    rebaseContinue,
    rebaseAbort,
    addRemote,
    removeRemote,
    refreshStatus,
  } = useAppStore()

  const [newBranchName, setNewBranchName] = useState('')
  const [newRemoteName, setNewRemoteName] = useState('')
  const [newRemoteUrl, setNewRemoteUrl] = useState('')
  // Merge/Rebase 对话框状态
  const [mergeTarget, setMergeTarget] = useState<string | null>(null)
  const [rebaseTarget, setRebaseTarget] = useState<string | null>(null)

  if (!repoStatus) return null

  const localBranches = repoStatus.branches.filter((b) => b.isLocal)
  const remoteBranches = repoStatus.branches.filter((b) => !b.isLocal)
  const isRebasing = repoStatus.status.rebaseMerge

  /** 创建新分支 */
  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      createBranch(newBranchName.trim())
      setNewBranchName('')
    }
  }

  /** 添加远程仓库 */
  const handleAddRemote = () => {
    if (newRemoteName.trim() && newRemoteUrl.trim()) {
      addRemote(newRemoteName.trim(), newRemoteUrl.trim())
      setNewRemoteName('')
      setNewRemoteUrl('')
    }
  }

  /** 执行 Merge */
  const handleMerge = (branch: string) => {
    doMerge(branch)
    setMergeTarget(null)
  }

  /** 执行 Rebase */
  const handleRebase = (branch: string) => {
    doRebase(branch)
    setRebaseTarget(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full overflow-y-auto"
    >
      {/* Rebase 进行中提示栏 */}
      {isRebasing && (
        <div className="px-3 py-3 border-b border-warning/30 bg-warning/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-warning">Rebase in Progress</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Resolve conflicts and continue, or abort to return to the previous state.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs border-success/50 text-success"
                onClick={rebaseContinue}
              >
                Continue
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-3 text-xs"
                onClick={rebaseAbort}
              >
                Abort
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 创建分支输入区 */}
      <div className="px-3 py-3 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
            placeholder="New branch name..."
            className="flex-1 px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleCreateBranch}
            disabled={!newBranchName.trim()}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>

      {/* 本地分支列表 */}
      <div className="border-b border-border">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Local Branches ({localBranches.length})
        </h3>
        {localBranches.map((branch) => (
          <div
            key={branch.name}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary group"
          >
            {/* 当前分支指示器 */}
            {branch.isHead && (
              <span className="text-success text-xs">●</span>
            )}
            {/* 分支名称 */}
            <span
              className={cn(
                'flex-1 text-sm',
                branch.isHead
                  ? 'text-foreground font-medium'
                  : 'text-foreground'
              )}
            >
              {branch.name}
            </span>
            {/* 目标 commit 短哈希 */}
            <span className="text-xs font-mono text-muted-foreground">
              {branch.target.slice(0, 7)}
            </span>
            {/* 操作按钮（非当前分支才显示） */}
            <div className="hidden group-hover:flex items-center gap-1">
              {!branch.isHead && (
                <>
                  <button
                    onClick={() => switchBranch(branch.name)}
                    className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-accent"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => handleMerge(branch.name)}
                    className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-info"
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => handleRebase(branch.name)}
                    className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-warning"
                  >
                    Rebase
                  </button>
                  <button
                    onClick={() => deleteBranch(branch.name)}
                    className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-destructive"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 远程分支列表 */}
      <div className="border-b border-border">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Remote Branches ({remoteBranches.length})
        </h3>
        {remoteBranches.map((branch) => (
          <div
            key={branch.name}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary group"
          >
            <span className="flex-1 text-sm text-muted-foreground">
              {branch.name}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {branch.target.slice(0, 7)}
            </span>
            {/* 远程分支也支持 merge/rebase 操作 */}
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={() => handleMerge(branch.name)}
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-info"
              >
                Merge
              </button>
              <button
                onClick={() => handleRebase(branch.name)}
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-warning"
              >
                Rebase
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 远程仓库管理 */}
      <div>
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Remotes ({repoStatus.remotes.length})
        </h3>
        {repoStatus.remotes.map((remote) => (
          <div
            key={remote.name}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary group"
          >
            <span className="text-sm font-medium text-foreground">
              {remote.name}
            </span>
            <span className="flex-1 text-xs text-muted-foreground truncate">
              {remote.fetchUrl}
            </span>
            <button
              onClick={() => removeRemote(remote.name)}
              className="hidden group-hover:block px-2 py-0.5 text-xs rounded bg-muted hover:bg-secondary text-destructive"
            >
              Remove
            </button>
          </div>
        ))}

        {/* 添加远程仓库表单 */}
        <div className="px-3 py-2 flex gap-2">
          <input
            type="text"
            value={newRemoteName}
            onChange={(e) => setNewRemoteName(e.target.value)}
            placeholder="Name"
            className="w-24 px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={newRemoteUrl}
            onChange={(e) => setNewRemoteUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRemote()}
            placeholder="URL"
            className="flex-1 px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleAddRemote}
            disabled={!newRemoteName.trim() || !newRemoteUrl.trim()}
            className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  )
}
