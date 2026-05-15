import type { RemoteSessionMeta } from '@shared/types'
import type { SessionShellPhase } from './types'
import type { AppSettings } from '@shared/types'
import { TerminalPanel } from '../terminal/TerminalPanel'
import { Button } from '../ui/button'
import styles from '../../views/SessionView.module.scss'

interface SessionShellPanelProps {
  shellPhase: SessionShellPhase
  cid: string
  meta: RemoteSessionMeta
  term: AppSettings['terminal'] | undefined
  onReconnect: () => void
  onExit: () => void
  labels: { starting: string; exitedHint: string; reconnect: string }
}

export function SessionShellPanel({
  shellPhase,
  cid,
  meta,
  term,
  onReconnect,
  onExit,
  labels,
}: SessionShellPanelProps) {
  return (
    <div className={styles.termArea}>
      {shellPhase === 'starting' ? (
        <div className={styles.muted}>{labels.starting}</div>
      ) : null}
      {shellPhase === 'exited' ? (
        <div className={styles.shellExited}>
          <p className={styles.shellExitedText}>{labels.exitedHint}</p>
          <Button type="button" variant="secondary" onClick={onReconnect}>
            {labels.reconnect}
          </Button>
        </div>
      ) : null}
      {shellPhase === 'connected' ? (
        <TerminalPanel
          mode={{ kind: 'ssh', connectionId: cid }}
          title={meta.hostLabel || `${meta.username}@${meta.host}`}
          protocol="SSH"
          status="connected"
          settings={term}
          session={meta}
          onExit={onExit}
        />
      ) : null}
    </div>
  )
}
