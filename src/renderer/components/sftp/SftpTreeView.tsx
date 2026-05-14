import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SftpListEntry } from '@shared/types'
import { ChevronRight, Folder, File, Loader } from 'lucide-react'
import { joinRemote } from '../../lib/sftp/path'
import { formatSize } from '../../lib/sftp/format'
import styles from './SftpTreeView.module.scss'

interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  size: number
  children: TreeNode[] | null
  loading: boolean
  expanded: boolean
}

function entryToNode(entry: SftpListEntry, parentPath: string): TreeNode {
  return {
    name: entry.name,
    path: joinRemote(parentPath, entry.name),
    isDirectory: entry.isDirectory,
    size: entry.size,
    children: entry.isDirectory ? null : undefined as unknown as null,
    loading: false,
    expanded: false,
  }
}

export interface SftpTreeViewProps {
  connectionId: string
  cwd: string
  entries: SftpListEntry[]
  onNavigate: (path: string) => void
  onOpenFile: (path: string) => void
  onContextMenu: (e: React.MouseEvent, entry: SftpListEntry) => void
  onListContextMenu: (e: React.MouseEvent) => void
}

export function SftpTreeView({
  connectionId,
  cwd,
  entries,
  onNavigate,
  onOpenFile,
  onContextMenu,
  onListContextMenu,
}: SftpTreeViewProps) {
  const treeRootRef = useRef<HTMLUListElement>(null)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [loadedChildren, setLoadedChildren] = useState<Map<string, TreeNode[] | null>>(new Map())
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set())

  // Reset state when cwd changes
  useEffect(() => {
    setExpandedPaths(new Set())
    setLoadedChildren(new Map())
  }, [cwd])

  const loadChildren = useCallback(async (dirPath: string) => {
    if (loadedChildren.has(dirPath) || loadingPaths.has(dirPath)) return
    setLoadingPaths((prev) => new Set(prev).add(dirPath))
    try {
      const list = await window.api.sftpReaddir(connectionId, dirPath) as SftpListEntry[]
      const nodes = list.map((entry) => entryToNode(entry, dirPath))
      setLoadedChildren((prev) => {
        const next = new Map(prev)
        next.set(dirPath, nodes)
        return next
      })
    } catch {
      setLoadedChildren((prev) => {
        const next = new Map(prev)
        next.set(dirPath, [])
        return next
      })
    } finally {
      setLoadingPaths((prev) => {
        const s = new Set(prev)
        s.delete(dirPath)
        return s
      })
    }
  }, [connectionId, loadedChildren, loadingPaths])

  const toggleExpand = useCallback((dirPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(dirPath)) {
        next.delete(dirPath)
      } else {
        next.add(dirPath)
        if (!loadedChildren.has(dirPath)) {
          void loadChildren(dirPath)
        }
      }
      return next
    })
  }, [loadedChildren, loadChildren])

  const handleRowClick = useCallback((node: TreeNode) => {
    if (node.isDirectory) {
      onNavigate(node.path)
    } else {
      onOpenFile(node.path)
    }
  }, [onNavigate, onOpenFile])

  const handleExpanderClick = useCallback((e: React.MouseEvent, dirPath: string) => {
    e.stopPropagation()
    toggleExpand(dirPath)
  }, [toggleExpand])

  // Build the tree structure from entries + loaded children
  const treeNodes = useMemo(() => entries.map((e) => entryToNode(e, cwd)), [entries, cwd])

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedPaths.has(node.path)
    const isLoading = loadingPaths.has(node.path)
    const children = loadedChildren.get(node.path)

    return (
      <li key={node.path} className={styles.treeNode}>
        <div
          className={`${styles.treeRow} ${node.path === cwd ? styles.treeRowActive : ''}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => handleRowClick(node)}
          onContextMenu={(e) => {
            const fakeEntry: SftpListEntry = {
              name: node.name,
              longname: '',
              isDirectory: node.isDirectory,
              size: node.size,
              mtimeMs: null,
            }
            onContextMenu(e, fakeEntry)
          }}
        >
          {node.isDirectory ? (
            <span
              className={`${styles.expander} ${isExpanded ? styles.expanded : ''}`}
              onClick={(e) => handleExpanderClick(e, node.path)}
            >
              {isLoading ? <Loader size={10} className={styles.spinner} /> : <ChevronRight size={12} />}
            </span>
          ) : (
            <span className={styles.expanderPlaceholder} />
          )}
          <span className={styles.treeIcon}>
            {node.isDirectory ? (
              <Folder size={14} />
            ) : (
              <File size={14} />
            )}
          </span>
          <span className={styles.entryName}>{node.name}</span>
          {!node.isDirectory && (
            <span className={styles.entrySize}>{formatSize(node.size)}</span>
          )}
        </div>
        {node.isDirectory && isExpanded && children && children.length > 0 && (
          <ul className={styles.treeChildren}>
            {children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
        {node.isDirectory && isExpanded && isLoading && !children && (
          <div className={styles.treeLoading} style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}>
            {null}
          </div>
        )}
      </li>
    )
  }

  return (
    <ul
      ref={treeRootRef}
      className={styles.treeList}
      onContextMenu={onListContextMenu}
    >
      {treeNodes.map((node) => renderNode(node, 0))}
    </ul>
  )
}
