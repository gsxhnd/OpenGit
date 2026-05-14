import type { TransferItem } from './types'
import { formatSize } from '../../lib/sftp/format'
import styles from '../../views/SessionView.module.scss'

interface TransferQueueProps {
  transfers: TransferItem[]
}

export function TransferQueue({ transfers }: TransferQueueProps) {
  if (transfers.length === 0) return null

  return (
    <div className={styles.transferQueue}>
      {transfers.map((transfer) => (
        <div key={transfer.id} className={styles.transferBar}>
          <div className={styles.transferInfo}>
            <span className={styles.transferArrow}>{transfer.kind === 'upload' ? '↑' : '↓'}</span>
            <span className={styles.transferName}>{transfer.path.split('/').pop()}</span>
            <span className={styles.transferSize}>
              {formatSize(transfer.bytes)}{transfer.total > 0 && ` / ${formatSize(transfer.total)}`}
            </span>
          </div>
          <div className={styles.transferProgress}>
            <div
              className={styles.transferFill}
              style={{ width: transfer.total > 0 ? `${Math.round((transfer.bytes / transfer.total) * 100)}%` : '100%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
