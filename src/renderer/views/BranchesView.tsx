import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'

export function BranchesView() {
  const {
    repoStatus,
    createBranch,
    deleteBranch,
    switchBranch,
    addRemote,
    removeRemote,
    refreshStatus,
  } = useAppStore()

  const [newBranchName, setNewBranchName] = useState('')
  const [newRemoteName, setNewRemoteName] = useState('')
  const [newRemoteUrl, setNewRemoteUrl] = useState('')

  if (!repoStatus) return null

  const localBranches = repoStatus.branches.filter((b) => b.isLocal)
  const remoteBranches = repoStatus.branches.filter((b) => !b.isLocal)

  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      createBranch(newBranchName.trim())
      setNewBranchName('')
    }
  }

  const handleAddRemote = () => {
    if (newRemoteName.trim() && newRemoteUrl.trim()) {
      addRemote(newRemoteName.trim(), newRemoteUrl.trim())
      setNewRemoteName('')
      setNewRemoteUrl('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full overflow-y-auto"
    >
      {/* Create branch */}
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

      {/* Local branches */}
      <div className="border-b border-border">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Local Branches ({localBranches.length})
        </h3>
        {localBranches.map((branch) => (
          <div
            key={branch.name}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary group"
          >
            {branch.isHead && (
              <span className="text-success text-xs">●</span>
            )}
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
            <span className="text-xs font-mono text-muted-foreground">
              {branch.target.slice(0, 7)}
            </span>
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

      {/* Remote branches */}
      <div className="border-b border-border">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Remote Branches ({remoteBranches.length})
        </h3>
        {remoteBranches.map((branch) => (
          <div
            key={branch.name}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary"
          >
            <span className="flex-1 text-sm text-muted-foreground">
              {branch.name}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {branch.target.slice(0, 7)}
            </span>
          </div>
        ))}
      </div>

      {/* Remotes */}
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

        {/* Add remote */}
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
