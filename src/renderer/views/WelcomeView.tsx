import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import type { HostProfile, SshConnectPayload } from '@shared/types'
import styles from './WelcomeView.module.scss'

export function WelcomeView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings, loadSettings, addSession, addToast } = useAppStore()
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [label, setLabel] = useState('')
  const [connecting, setConnecting] = useState(false)

  const hosts = settings?.hosts ?? []

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const doConnect = async (payload: SshConnectPayload, meta: { hostLabel: string }) => {
    setConnecting(true)
    try {
      const { connectionId, fingerprint, isNewHost } = await window.api.sshConnect(payload)
      addSession({
        connectionId,
        hostLabel: meta.hostLabel,
        username: payload.username,
        host: payload.host,
        port: payload.port,
        fingerprint,
      })
      if (isNewHost) {
        addToast(t('welcome.newHostKey', { fingerprint }), 'info')
      } else {
        addToast(t('welcome.connected', { fingerprint }), 'info')
      }
      navigate(`/session/${connectionId}`)
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('err.connectionFailed'), 'error')
    } finally {
      setConnecting(false)
    }
  }

  const handleQuickConnect = () => {
    const p = Number(port) || 22
    if (!host.trim() || !username.trim()) {
      addToast(t('welcome.hostUsernameRequired'), 'error')
      return
    }
    if (!password.trim()) {
      addToast(t('welcome.passwordRequired'), 'error')
      return
    }
    void doConnect(
      { host: host.trim(), port: p, username: username.trim(), password },
      { hostLabel: label.trim() || host.trim() },
    )
  }

  const connectSaved = (h: HostProfile) => {
    const pass = h.password
    const pk = h.privateKeyPath
    if (h.authType === 'password' && !pass) {
      addToast(t('welcome.noPasswordStored'), 'error')
      return
    }
    if (h.authType === 'privateKey' && !pk) {
      addToast(t('welcome.noKeyPath'), 'error')
      return
    }
    void doConnect(
      {
        host: h.host,
        port: h.port || 22,
        username: h.username,
        password: h.authType === 'password' ? pass : undefined,
        privateKeyPath: h.authType === 'privateKey' ? pk : undefined,
        passphrase: h.passphrase,
        expectedFingerprint: h.trustedFingerprint,
      },
      { hostLabel: h.label },
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
      <div className={styles.textCenter}>
        <h1 className={styles.title}>{t('welcome.title')}</h1>
        <p className={styles.subtitle}>{t('welcome.subtitle')}</p>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => navigate('/local-terminal')}>
          {t('welcome.localTerminal')}
        </Button>
        <Button variant="outline" onClick={() => void loadSettings()}>
          {t('welcome.refreshHosts')}
        </Button>
      </div>

      <div className={styles.panel}>
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
      </div>

      {hosts.length > 0 && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('welcome.savedHosts')}</h2>
          <ul className={styles.hostList}>
            {hosts.map((h) => (
              <li key={h.id} className={styles.hostItem}>
                <div>
                  <div className={styles.hostName}>{h.label}</div>
                  <div className={styles.hostMeta}>
                    {h.username}@{h.host}:{h.port}
                  </div>
                </div>
                <Button size="sm" variant="secondary" disabled={connecting} onClick={() => connectSaved(h)}>
                  {t('welcome.connect')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
