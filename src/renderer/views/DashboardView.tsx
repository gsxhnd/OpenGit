import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAppStore } from '../store'
import { useSshConnect } from '../hooks/useSshConnect'
import styles from './DashboardView.module.scss'

export function DashboardView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { loadSettings, addToast } = useAppStore()
  const { connecting, doConnect } = useSshConnect()

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('workbench.dashboard')}</h1>
        <p className={styles.subtitle}>{t('welcome.subtitle')}</p>
      </header>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => navigate('/local-terminal')}>
          {t('welcome.localTerminal')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/connections')}>
          {t('workbench.connections')}
        </Button>
      </div>

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
