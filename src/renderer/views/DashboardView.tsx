import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Server, TerminalSquare } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAppStore } from '../store'
import { useSshConnect } from '../hooks/useSshConnect'
import styles from './DashboardView.module.scss'

export function DashboardView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { loadSettings, addToast, settings, sessions } = useAppStore()
  const { connecting, doConnect, connectSaved } = useSshConnect()

  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [label, setLabel] = useState('')

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleQuickConnect = () => {
    const parsedPort = Number(port) || 22
    if (!host.trim() || !username.trim()) {
      addToast(t('welcome.hostUsernameRequired'), 'error')
      return
    }
    if (!password.trim()) {
      addToast(t('welcome.passwordRequired'), 'error')
      return
    }

    void doConnect(
      { host: host.trim(), port: parsedPort, username: username.trim(), password },
      { hostLabel: label.trim() || host.trim() },
    )
  }

  const hosts = settings?.hosts ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('workbench.dashboard')}</h1>
        <p className={styles.subtitle}>{t('welcome.subtitle')}</p>
      </header>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => navigate('/local-terminal')}>
          <TerminalSquare size={14} className="mr-1" />
          {t('welcome.localTerminal')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/connections')}>
          {t('workbench.connections')}
        </Button>
      </div>

      {sessions.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('workbench.sessions')}</h2>
          <ul className={styles.hostList}>
            {sessions.map((session) => (
              <li key={session.connectionId} className={styles.hostItem}>
                <div>
                  <div className={styles.hostName}>{session.hostLabel}</div>
                  <div className={styles.hostMeta}>{session.username}@{session.host}:{session.port}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/session/${session.connectionId}`)}>
                  {t('workbench.openSession')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hosts.length > 0 && (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{t('welcome.savedHosts')}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/connections')}>
              {t('workbench.connections')} →
            </Button>
          </div>
          <ul className={styles.hostList}>
            {hosts.slice(0, 5).map((h) => (
              <li key={h.id} className={styles.hostItem}>
                <div className={styles.hostInfo}>
                  <Server size={14} className={styles.hostIcon} />
                  <div>
                    <div className={styles.hostName}>{h.label}</div>
                    <div className={styles.hostMeta}>{h.username}@{h.host}:{h.port}</div>
                  </div>
                </div>
                <Button size="sm" variant="secondary" disabled={connecting} onClick={() => void connectSaved(h)}>
                  {t('welcome.connect')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>{t('welcome.quickConnect')}</h2>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            {t('welcome.label')}
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My server" />
          </label>
          <label className={styles.label}>
            {t('welcome.host')}
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.10" />
          </label>
          <label className={styles.label}>
            {t('welcome.port')}
            <Input value={port} onChange={(e) => setPort(e.target.value)} />
          </label>
          <label className={styles.label}>
            {t('welcome.username')}
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ubuntu" />
          </label>
          <label className={`${styles.label} ${styles.fullRow}`}>
            {t('welcome.password')}
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        </div>

        <Button className={styles.connectBtn} size="lg" disabled={connecting} onClick={handleQuickConnect}>
          {connecting ? t('welcome.connecting') : t('welcome.connect')}
        </Button>
      </section>
    </motion.div>
  )
}
