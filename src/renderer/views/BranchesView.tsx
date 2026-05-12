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
import { useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import styles from './BranchesView.module.scss'

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
      className={styles.container}
    >
      {/* Rebase 进行中提示栏 */}
      {isRebasing && (
        <div className={styles.rebaseBanner}>
          <div className={styles.rebaseBannerInner}>
            <div>
              <h4 className={styles.rebaseTitle}>Rebase in Progress</h4>
              <p className={styles.rebaseDescription}>
                Resolve conflicts and continue, or abort to return to the previous state.
              </p>
            </div>
            <div className={styles.rebaseActions}>
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
      <div className={styles.createSection}>
        <div className={styles.createRow}>
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
            placeholder="New branch name..."
            className={styles.input}
          />
          <button
            onClick={handleCreateBranch}
            disabled={!newBranchName.trim()}
            className={styles.createButton}
          >
            Create
          </button>
        </div>
      </div>

      {/* 本地分支列表 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Local Branches ({localBranches.length})
        </h3>
        {localBranches.map((branch) => (
          <div
            key={branch.name}
            className={styles.branchRow}
          >
            {/* 当前分支指示器 */}
            {branch.isHead && (
              <span className={styles.headIndicator}>●</span>
            )}
            {/* 分支名称 */}
            <span
              className={`${styles.branchName} ${branch.isHead ? styles.branchNameHead : ''}`}
            >
              {branch.name}
            </span>
            {/* 目标 commit 短哈希 */}
            <span className={styles.commitHash}>
              {branch.target.slice(0, 7)}
            </span>
            {/* 操作按钮（非当前分支才显示） */}
            <div className={styles.actions}>
              {!branch.isHead && (
                <>
                  <button
                    onClick={() => switchBranch(branch.name)}
                    className={`${styles.actionButton} ${styles.actionCheckout}`}
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => handleMerge(branch.name)}
                    className={`${styles.actionButton} ${styles.actionMerge}`}
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => handleRebase(branch.name)}
                    className={`${styles.actionButton} ${styles.actionRebase}`}
                  >
                    Rebase
                  </button>
                  <button
                    onClick={() => deleteBranch(branch.name)}
                    className={`${styles.actionButton} ${styles.actionDelete}`}
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
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Remote Branches ({remoteBranches.length})
        </h3>
        {remoteBranches.map((branch) => (
          <div
            key={branch.name}
            className={styles.branchRow}
          >
            <span className={`${styles.branchName} ${styles.branchNameRemote}`}>
              {branch.name}
            </span>
            <span className={styles.commitHash}>
              {branch.target.slice(0, 7)}
            </span>
            {/* 远程分支也支持 merge/rebase 操作 */}
            <div className={styles.actions}>
              <button
                onClick={() => handleMerge(branch.name)}
                className={`${styles.actionButton} ${styles.actionMerge}`}
              >
                Merge
              </button>
              <button
                onClick={() => handleRebase(branch.name)}
                className={`${styles.actionButton} ${styles.actionRebase}`}
              >
                Rebase
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 远程仓库管理 */}
      <div className={styles.sectionLast}>
        <h3 className={styles.sectionTitle}>
          Remotes ({repoStatus.remotes.length})
        </h3>
        {repoStatus.remotes.map((remote) => (
          <div
            key={remote.name}
            className={styles.branchRow}
          >
            <span className={styles.remoteName}>
              {remote.name}
            </span>
            <span className={styles.remoteUrl}>
              {remote.fetchUrl}
            </span>
            <button
              onClick={() => removeRemote(remote.name)}
              className={`${styles.actionButton} ${styles.actionRemove}`}
            >
              Remove
            </button>
          </div>
        ))}

        {/* 添加远程仓库表单 */}
        <div className={styles.addRemoteForm}>
          <input
            type="text"
            value={newRemoteName}
            onChange={(e) => setNewRemoteName(e.target.value)}
            placeholder="Name"
            className={`${styles.inputSmall} ${styles.inputName}`}
          />
          <input
            type="text"
            value={newRemoteUrl}
            onChange={(e) => setNewRemoteUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRemote()}
            placeholder="URL"
            className={`${styles.inputSmall} ${styles.inputUrl}`}
          />
          <button
            onClick={handleAddRemote}
            disabled={!newRemoteName.trim() || !newRemoteUrl.trim()}
            className={styles.addButton}
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  )
}
