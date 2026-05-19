import { MonitorPlay, Plug, Server, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './DashboardPanels.module.scss'

export interface DashboardStats {
  savedHosts: number
  activeSessions: number
  knownHosts: number
  recentConnections: number
}

interface DashboardStatsPanelProps {
  stats: DashboardStats
}

const statItems = [
  { key: 'savedHosts', icon: Plug, statKey: 'savedHosts' as const },
  { key: 'activeSessions', icon: MonitorPlay, statKey: 'activeSessions' as const },
  { key: 'knownHosts', icon: Shield, statKey: 'knownHosts' as const },
  { key: 'recentConnections', icon: Server, statKey: 'recentConnections' as const },
] as const

export function DashboardStatsPanel({ stats }: DashboardStatsPanelProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.statsGrid} aria-label={t('dashboard.overview')}>
      {statItems.map(({ key, icon: Icon, statKey }) => (
        <article key={key} className={styles.statCard}>
          <div className={styles.statIcon}>
            <Icon />
          </div>
          <div className={styles.statBody}>
            <div className={styles.statValue}>{stats[statKey]}</div>
            <div className={styles.statLabel}>{t(`dashboard.stat.${key}`)}</div>
          </div>
        </article>
      ))}
    </section>
  )
}
