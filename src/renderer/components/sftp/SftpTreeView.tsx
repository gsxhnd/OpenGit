import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SftpListEntry } from '@shared/types'
import { ChevronRight, Folder, File, Loader, Download, FolderPlus, Pencil, Trash2, Info } from 'lucide-react'
import { joinRemote } from '../../lib/sftp/path'
import { formatSize } from '../../lib/sftp/format'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu'
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

function nodeToEntry(node: TreeNode): SftpListEntry {
  return {
    name: node.name,
    longname: '',
    isDirectory: node.isDirectory,
    size: node.size,
    mtimeMs: null,
  }
}

export interface SftpTreeViewProps {
  connectionId: string
  cwd: string
  entries: SftpListEntry[]
  labels: {
    newFolder: string
    download: string
    rename: string
    delete: string
    properties: string
  }
  onNavigate: (path: string) => void
  onOpenFile: (path: string) => void
  onNewFolder: () => void
  onDownload: (entry: SftpListEntry) => void
  onRename: (entry: SftpListEntry) => void
  onDelete: (entry: SftpListEntry) => void
  onProperties: (entry: SftpListEntry) => void
}

export function SftpTreeView({
  connectionId,
  cwd,
  entries,
  labels,
  onNavigate,
  onOpenFile,
  onNewFolder,
  onDownload,
  onRename,
  onDelete,
  onProperties,
}: SftpTreeViewProps) {
  const treeRootRef = useRef<HTMLUListElement>(null)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [loadedChildren, setLoadedChildren] = useState<Map<string, TreeNode[] | null>>(new Map())
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set())

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

  const treeNodes = useMemo(() => entries.map((e) => entryToNode(e, cwd)), [entries, cwd])

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedPaths.has(node.path)
    const isLoading = loadingPaths.has(node.path)
    const children = loadedChildren.get(node.path)
    const entry = nodeToEntry(node)

    const row = (
      <div
        className={`${styles.treeRow} ${node.path === cwd ? styles.treeRowActive : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => handleRowClick(node)}
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
          {node.isDirectory ? <Folder size={14} /> : <File size={14} />}
        </span>
        <span className={styles.entryName}>{node.name}</span>
        {!node.isDirectory && (
          <span className={styles.entrySize}>{formatSize(node.size)}</span>
        )}
      </div>
    )

    const contextContent = (
      <ContextMenuContent>
        <ContextMenuItem onClick={onNewFolder}>
          <FolderPlus size={14} />
          {labels.newFolder}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {!entry.isDirectory && (
          <ContextMenuItem onClick={() => onDownload(entry)}>
            <Download size={14} />
            {labels.download}
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onRename(entry)}>
          <Pencil size={14} />
          {labels.rename}
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={() => onDelete(entry)}>
          <Trash2 size={14} />
          {labels.delete}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onProperties(entry)}>
          <Info size={14} />
          {labels.properties}
        </ContextMenuItem>
      </ContextMenuContent>
    )

    return (
      <li key={node.path} className={styles.treeNode}>
        <ContextMenu>
          <ContextMenuTrigger className={styles.rowTrigger}>
            {row}
          </ContextMenuTrigger>
          {contextContent}
        </ContextMenu>
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
    <ContextMenu>
      <ContextMenuTrigger className={styles.listTrigger}>
        <ul
          ref={treeRootRef}
          className={styles.treeList}
        >
          {treeNodes.map((node) => renderNode(node, 0))}
        </ul>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onNewFolder}>
          <FolderPlus size={14} />
          {labels.newFolder}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
