import type { SftpListEntry } from '@shared/types'
import { Button } from '../ui/button'
import { formatPerms, formatSize } from '../../lib/sftp/format'
import styles from '../../views/SessionView.module.scss'

interface PropertiesDialogProps {
  detail: SftpListEntry
  labels: {
    title: string
    close: string
  }
  onClose: () => void
}

export function PropertiesDialog({ detail, labels, onClose }: PropertiesDialogProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.modalTitle}>{labels.title}</h3>
        <div className={styles.propsTable}>
          <div className={styles.propsRow}>
            <span className={styles.propsLabel}>Name</span>
            <span className={styles.propsValue}>{detail.name}</span>
          </div>
          <div className={styles.propsRow}>
            <span className={styles.propsLabel}>Type</span>
            <span className={styles.propsValue}>{detail.isDirectory ? 'Directory' : 'File'}</span>
          </div>
          <div className={styles.propsRow}>
            <span className={styles.propsLabel}>Size</span>
            <span className={styles.propsValue}>{formatSize(detail.size)}</span>
          </div>
          <div className={styles.propsRow}>
            <span className={styles.propsLabel}>Permissions</span>
            <span className={styles.propsValueMono}>{formatPerms(detail)}</span>
          </div>
          {detail.mtimeMs ? (
            <div className={styles.propsRow}>
              <span className={styles.propsLabel}>Modified</span>
              <span className={styles.propsValue}>{new Date(detail.mtimeMs).toLocaleString()}</span>
            </div>
          ) : null}
        </div>
        <div className={styles.modalActions}>
          <Button size="sm" variant="secondary" onClick={onClose}>
            {labels.close}
          </Button>
        </div>
      </div>
    </div>
  )
}
