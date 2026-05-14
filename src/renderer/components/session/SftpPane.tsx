import type { SftpListEntry } from '@shared/types'
import { ArrowUp, FolderPlus, Upload } from 'lucide-react'
import { Button } from '../ui/button'
import { SftpTreeView } from '../sftp/SftpTreeView'
import { parentPath } from '../../lib/sftp/path'
import type { TransferItem } from './types'
import { TransferQueue } from './TransferQueue'
import styles from '../../views/SessionView.module.scss'

interface SftpPaneProps {
  connectionId: string
  cwd: string
  entries: SftpListEntry[]
  transfers: TransferItem[]
  labels: {
    parent: string
    newFolder: string
    upload: string
  }
  onNavigate: (path: string) => void
  onOpenFile: (path: string) => void
  onEntryContextMenu: (event: React.MouseEvent, entry: SftpListEntry) => void
  onListContextMenu: (event: React.MouseEvent) => void
  onNewFolder: () => void
  onUpload: () => void
}

export function SftpPane({
  connectionId,
  cwd,
  entries,
  transfers,
  labels,
  onNavigate,
  onOpenFile,
  onEntryContextMenu,
  onListContextMenu,
  onNewFolder,
  onUpload,
}: SftpPaneProps) {
  const parts = cwd.split('/').filter(Boolean)

  return (
    <aside className={styles.sftp}>
      <div className={styles.sftpToolbar}>
        <Button size="sm" variant="ghost" title={labels.parent} onClick={() => onNavigate(parentPath(cwd))}>
          <ArrowUp size={16} />
        </Button>
        <Button size="sm" variant="ghost" title={labels.newFolder} onClick={onNewFolder}>
          <FolderPlus size={14} />
        </Button>
        <Button size="sm" variant="secondary" onClick={onUpload}>
          <Upload size={14} className="mr-1" />
          {labels.upload}
        </Button>
      </div>
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.breadcrumbItem} onClick={() => onNavigate('/')}>
          /
        </button>
        {parts.map((part, index) => {
          const path = '/' + parts.slice(0, index + 1).join('/')
          return (
            <span key={path}>
              <span className={styles.breadcrumbSep}>/</span>
              <button type="button" className={styles.breadcrumbItem} onClick={() => onNavigate(path)}>
                {part}
              </button>
            </span>
          )
        })}
      </div>
      <TransferQueue transfers={transfers} />
      <SftpTreeView
        connectionId={connectionId}
        cwd={cwd}
        entries={entries}
        onNavigate={onNavigate}
        onOpenFile={onOpenFile}
        onContextMenu={onEntryContextMenu}
        onListContextMenu={onListContextMenu}
      />
    </aside>
  )
}
