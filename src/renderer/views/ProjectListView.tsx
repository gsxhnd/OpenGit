/**
 * ProjectListView - 多项目管理视图
 *
 * Phase 5 核心功能：管理多个 Git 仓库项目。
 * 提供以下能力：
 * - 项目列表展示（名称、路径、最后打开时间）
 * - 添加新项目（通过系统文件选择对话框）
 * - 移除项目（从列表中移除，不删除文件）
 * - 项目分组管理（创建/删除分组）
 * - 快速搜索过滤项目
 * - 点击项目快速切换打开
 * - 拖拽排序（通过上下移动按钮模拟）
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import type { WorkspaceEntry, WorkspaceGroup } from '@shared/types'
import styles from './ProjectListView.module.scss'

export function ProjectListView() {
  const {
    workspaceConfig,
    addWorkspaceEntry,
    removeWorkspaceEntry,
    reorderWorkspaceEntries,
    switchWorkspace,
    addWorkspaceGroup,
    removeWorkspaceGroup,
    repoPath,
  } = useAppStore()
  const navigate = useNavigate()

  // 搜索过滤
  const [searchFilter, setSearchFilter] = useState('')
  // 新建分组对话框
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const entries = workspaceConfig?.entries || []
  const groups = workspaceConfig?.groups || []

  /** 过滤后的项目列表 */
  const filteredEntries = useMemo(() => {
    if (!searchFilter.trim()) return entries
    const q = searchFilter.toLowerCase()
    return entries.filter(
      (e) => e.name.toLowerCase().includes(q) || e.path.toLowerCase().includes(q)
    )
  }, [entries, searchFilter])

  /** 按分组归类项目 */
  const groupedEntries = useMemo(() => {
    const grouped: Record<string, WorkspaceEntry[]> = { ungrouped: [] }
    for (const group of groups) {
      grouped[group.id] = []
    }
    for (const entry of filteredEntries) {
      if (entry.groupId && grouped[entry.groupId]) {
        grouped[entry.groupId].push(entry)
      } else {
        grouped['ungrouped'].push(entry)
      }
    }
    return grouped
  }, [filteredEntries, groups])

  /** 通过系统对话框添加新项目 */
  const handleAddProject = async () => {
    try {
      const path = await window.api.openDirectory()
      if (path) {
        const name = path.split('/').pop() || path
        await addWorkspaceEntry({ path, name })
      }
    } catch {
      // 用户取消选择
    }
  }

  /** 创建新分组 */
  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const id = `group-${Date.now()}`
      addWorkspaceGroup({ id, name: newGroupName.trim() })
      setNewGroupName('')
      setShowNewGroup(false)
    }
  }

  /** 打开项目 */
  const handleOpenProject = (index: number) => {
    switchWorkspace(index)
  }

  /** 移动项目顺序（上移/下移） */
  const handleMoveEntry = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= entries.length) return
    const newEntries = [...entries]
    const [moved] = newEntries.splice(fromIndex, 1)
    newEntries.splice(toIndex, 0, moved)
    reorderWorkspaceEntries(newEntries)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      {/* 头部：标题 + 操作按钮 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            ← Back
          </button>
          <h1 className={styles.title}>Projects</h1>
          <span className={styles.count}>({entries.length})</span>
        </div>
        <div className={styles.headerRight}>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={() => setShowNewGroup(true)}
          >
            New Group
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleAddProject}
          >
            Add Project
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className={styles.searchBar}>
        <Input
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search projects by name or path..."
          className="h-8 text-sm"
        />
      </div>

      {/* 新建分组对话框 */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={styles.newGroupPanel}
          >
            <div className={styles.newGroupInner}>
              <Input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                placeholder="Group name..."
                className="h-7 text-sm flex-1"
              />
              <Button size="sm" className="h-7 px-3 text-xs" onClick={handleCreateGroup}>
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setShowNewGroup(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 项目列表 */}
      <div className={styles.projectList}>
        {/* 分组项目 */}
        {groups.map((group) => {
          const groupEntries = groupedEntries[group.id] || []
          return (
            <div key={group.id} className={styles.groupSection}>
              <div className={styles.groupHeader}>
                <h3 className={styles.groupTitle}>
                  {group.name} ({groupEntries.length})
                </h3>
                <button
                  onClick={() => removeWorkspaceGroup(group.id)}
                  className={styles.removeGroupButton}
                >
                  Remove Group
                </button>
              </div>
              {groupEntries.map((entry) => {
                const entryIndex = entries.findIndex((e) => e.path === entry.path)
                return (
                  <ProjectRow
                    key={entry.path}
                    entry={entry}
                    isActive={repoPath === entry.path}
                    index={entryIndex}
                    totalCount={entries.length}
                    onOpen={() => handleOpenProject(entryIndex)}
                    onRemove={() => removeWorkspaceEntry(entry.path)}
                    onMoveUp={() => handleMoveEntry(entryIndex, 'up')}
                    onMoveDown={() => handleMoveEntry(entryIndex, 'down')}
                  />
                )
              })}
              {groupEntries.length === 0 && (
                <p className={styles.emptyGroup}>No projects in this group</p>
              )}
            </div>
          )
        })}

        {/* 未分组项目 */}
        {groupedEntries['ungrouped']?.length > 0 && (
          <div className={styles.ungroupedSection}>
            {groups.length > 0 && (
              <div className={styles.ungroupedHeader}>
                <h3 className={styles.groupTitle}>
                  Ungrouped ({groupedEntries['ungrouped'].length})
                </h3>
              </div>
            )}
            {groupedEntries['ungrouped'].map((entry) => {
              const entryIndex = entries.findIndex((e) => e.path === entry.path)
              return (
                <ProjectRow
                  key={entry.path}
                  entry={entry}
                  isActive={repoPath === entry.path}
                  index={entryIndex}
                  totalCount={entries.length}
                  onOpen={() => handleOpenProject(entryIndex)}
                  onRemove={() => removeWorkspaceEntry(entry.path)}
                  onMoveUp={() => handleMoveEntry(entryIndex, 'up')}
                  onMoveDown={() => handleMoveEntry(entryIndex, 'down')}
                />
              )
            })}
          </div>
        )}

        {/* 空状态 */}
        {entries.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No projects added yet</p>
            <Button size="sm" onClick={handleAddProject}>
              Add Your First Project
            </Button>
          </div>
        )}

        {/* 搜索无结果 */}
        {entries.length > 0 && filteredEntries.length === 0 && (
          <div className={styles.noResults}>
            <p>No projects match "{searchFilter}"</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/**
 * 单个项目行组件
 */
function ProjectRow({
  entry,
  isActive,
  index,
  totalCount,
  onOpen,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  entry: WorkspaceEntry
  isActive: boolean
  index: number
  totalCount: number
  onOpen: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div
      className={`${styles.projectRow} ${isActive ? styles.active : ''}`}
      onClick={onOpen}
    >
      {/* 项目信息 */}
      <div className={styles.projectInfo}>
        <div className={styles.projectNameRow}>
          <span className={styles.projectName}>
            {entry.name}
          </span>
          {isActive && (
            <span className={styles.activeBadge}>
              Active
            </span>
          )}
        </div>
        <p className={styles.projectPath}>
          {entry.path}
        </p>
        {entry.lastOpened && (
          <p className={styles.lastOpened}>
            Last opened: {new Date(entry.lastOpened).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        {index > 0 && (
          <button
            onClick={onMoveUp}
            className={styles.moveButton}
            title="Move up"
          >
            ↑
          </button>
        )}
        {index < totalCount - 1 && (
          <button
            onClick={onMoveDown}
            className={styles.moveButton}
            title="Move down"
          >
            ↓
          </button>
        )}
        <button
          onClick={onRemove}
          className={styles.removeButton}
          title="Remove from list"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
