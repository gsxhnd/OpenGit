import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { useSshConnect } from '../hooks/connection/useSshConnect'
import { useRecentConnections } from '../hooks/connection/use-recent-connections'
import { DashboardStatsPanel } from '../components/dashboard/DashboardStatsPanel'
import { RecentConnectionsPanel } from '../components/dashboard/RecentConnectionsPanel'
import styles from './DashboardView.module.scss'

export function DashboardView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { loadSettings, settings, sessions } = useAppStore(
    useShallow((s) => ({
      loadSettings: s.loadSettings,
      settings: s.settings,
      sessions: s.sessions,
    })),
  )
  const { recents } = useRecentConnections()
  const { connecting, connectSaved } = useSshConnect()
  const [knownHostsCount, setKnownHostsCount] = useState(0)

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    let cancelled = false
    void window.api.knownHostsList().then((hosts) => {
      if (!cancelled) setKnownHostsCount(hosts.length)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const savedHosts = settings?.hosts ?? []

  const stats = useMemo(
    () => ({
      savedHosts: savedHosts.length,
      activeSessions: sessions.length,
      knownHosts: knownHostsCount,
      recentConnections: recents.length,
    }),
    [savedHosts.length, sessions.length, knownHostsCount, recents.length],
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.container}
    >
      <header className={styles.header}>
        <h1 className={styles.title}>{t('workbench.dashboard')}</h1>
        <p className={styles.subtitle}>{t('dashboard.subtitle')}</p>
      </header>

      <DashboardStatsPanel stats={stats} />

      <RecentConnectionsPanel
        recents={recents}
        savedHosts={savedHosts}
        connecting={connecting}
        onConnect={(host) => void connectSaved(host)}
        onViewConnections={() => navigate('/connections')}
      />
    </motion.div>
  )
}
