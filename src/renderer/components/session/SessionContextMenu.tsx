import type { SftpListEntry } from '@shared/types'
import { Download, FolderPlus, Info, Pencil, Trash2 } from 'lucide-react'
import type { ContextMenuState } from './types'
import styles from '../../views/SessionView.module.scss'

interface SessionContextMenuProps {
  state: ContextMenuState
  labels: {
    newFolder: string
    download: string
    rename: string
    delete: string
    properties: string
  }
  onNewFolder: () => void
  onDownload: (entry: SftpListEntry) => void
  onRename: () => void
  onDelete: () => void
  onProperties: () => void
}

export function SessionContextMenu({ state, labels, onNewFolder, onDownload, onRename, onDelete, onProperties }: SessionContextMenuProps) {
  if (!state.visible) return null

  return (
    <div className={styles.contextMenu} style={{ left: state.x, top: state.y }}>
      <button type="button" className={styles.contextMenuItem} onClick={onNewFolder}>
        <FolderPlus size={14} />
        <span>{labels.newFolder}</span>
      </button>
      {state.entry ? (
        <>
          {!state.entry.isDirectory ? (
            <button type="button" className={styles.contextMenuItem} onClick={() => onDownload(state.entry!)}>
              <Download size={14} />
              <span>{labels.download}</span>
            </button>
          ) : null}
          <button type="button" className={styles.contextMenuItem} onClick={onRename}>
            <Pencil size={14} />
            <span>{labels.rename}</span>
          </button>
          <button type="button" className={styles.contextMenuItem} onClick={onDelete}>
            <Trash2 size={14} />
            <span>{labels.delete}</span>
          </button>
          <button type="button" className={styles.contextMenuItem} onClick={onProperties}>
            <Info size={14} />
            <span>{labels.properties}</span>
          </button>
        </>
      ) : null}
    </div>
  )
}
