import type { RemoteSessionMeta } from '@shared/types'
import { Button } from '../ui/button'
import styles from '../../views/SessionView.module.scss'

interface SessionHeaderProps {
  meta: RemoteSessionMeta
  fingerprint?: string
  disconnectLabel: string
  onDisconnect: () => void
}

export function SessionHeader({ meta, fingerprint, disconnectLabel, onDisconnect }: SessionHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerMain}>
        <span className={styles.badge}>SSH</span>
        <span className={styles.sessionTitle}>{meta.username}@{meta.host}:{meta.port}</span>
        {fingerprint ? <span className={styles.fingerprint}>{fingerprint.slice(0, 16)}</span> : null}
      </div>
      <div className={styles.headerActions}>
        <Button size="sm" variant="destructive" onClick={onDisconnect}>
          {disconnectLabel}
        </Button>
      </div>
    </div>
  )
}
