import { Clock, Plug, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { HostProfile } from '@shared/types'
import type { RecentConnection } from '@renderer/hooks/connection/use-recent-connections'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import styles from './DashboardPanels.module.scss'

interface RecentConnectionsPanelProps {
  recents: RecentConnection[]
  savedHosts: HostProfile[]
  connecting: boolean
  onConnect: (host: HostProfile) => void
  onViewConnections: () => void
}

function findSavedHost(
  hosts: HostProfile[],
  entry: RecentConnection,
): HostProfile | undefined {
  if (entry.hostProfileId) {
    return hosts.find((h) => h.id === entry.hostProfileId)
  }
  return hosts.find(
    (h) =>
      h.host === entry.host &&
      (h.port || 22) === entry.port &&
      h.username === entry.username,
  )
}

function formatRelativeTime(timestamp: number, locale: string): string {
  const diffSec = Math.round((timestamp - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (abs < 60) return rtf.format(diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  const diffDay = Math.round(diffHour / 24)
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day')
  const diffMonth = Math.round(diffDay / 30)
  return rtf.format(diffMonth, 'month')
}

export function RecentConnectionsPanel({
  recents,
  savedHosts,
  connecting,
  onConnect,
  onViewConnections,
}: RecentConnectionsPanelProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card className={styles.panelCard}>
      <CardHeader>
        <CardTitle>{t('dashboard.recentConnections')}</CardTitle>
        <CardDescription>{t('dashboard.recentConnectionsHint')}</CardDescription>
      </CardHeader>
      <CardContent className={styles.panelContent}>
        {recents.length === 0 ? (
          <div className={styles.empty}>
            <Plug className={styles.emptyIcon} />
            <p>{t('dashboard.noRecentConnections')}</p>
            <Button size="sm" variant="outline" onClick={onViewConnections}>
              {t('workbench.connections')}
            </Button>
          </div>
        ) : (
          <ul className={styles.recentList}>
            {recents.map((entry) => {
              const saved = findSavedHost(savedHosts, entry)
              return (
                <li key={entry.id} className={styles.recentItem}>
                  <RecentRow entry={entry} locale={i18n.language} />
                  {saved ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={connecting}
                      onClick={() => onConnect(saved)}
                    >
                      {connecting ? t('welcome.connecting') : t('welcome.connect')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={onViewConnections}>
                      {t('dashboard.manageHosts')}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function RecentRow({ entry, locale }: { entry: RecentConnection; locale: string }) {
  return (
    <div className={styles.recentInfo}>
      <span className={styles.recentIcon}>
        <Server />
      </span>
      <div className={styles.recentText}>
        <div className={styles.recentTitle}>{entry.hostLabel}</div>
        <div className={styles.recentMeta}>
          {entry.username}@{entry.host}:{entry.port}
        </div>
        <RecentTime connectedAt={entry.connectedAt} locale={locale} />
      </div>
    </div>
  )
}

function RecentTime({ connectedAt, locale }: { connectedAt: number; locale: string }) {
  return (
    <div className={styles.recentTime}>
      <Clock />
      {formatRelativeTime(connectedAt, locale)}
    </div>
  )
}
