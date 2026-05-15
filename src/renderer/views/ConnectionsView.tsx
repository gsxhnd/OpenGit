import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { useSshConnect } from '../hooks/useSshConnect'
import styles from './ConnectionsView.module.scss'

export function ConnectionsView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings, loadSettings } = useAppStore()
  const { connectSaved, connecting } = useSshConnect()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const hosts = settings?.hosts ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('workbench.connections')}</h1>
        <p className={styles.subtitle}>{t('workbench.connectionsHint')}</p>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('welcome.savedHosts')}</h2>
          <div className={styles.panelActions}>
            <Button variant="outline" size="sm" onClick={() => void loadSettings()}>
              {t('welcome.refreshHosts')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
              <Plus size={14} className="mr-1" />
              {t('settings.addHost')}
            </Button>
          </div>
        </div>

        {hosts.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('workbench.noSavedConnections')}</p>
            <Button variant="outline" size="sm" className={styles.emptyAction} onClick={() => navigate('/settings')}>
              <Plus size={14} className="mr-1" />
              {t('settings.addHost')}
            </Button>
          </div>
        ) : (
          <ul className={styles.hostList}>
            {hosts.map((host) => (
              <li key={host.id} className={styles.hostItem}>
                <div>
                  <div className={styles.hostName}>{host.label}</div>
                  <div className={styles.hostMeta}>
                    {host.username}@{host.host}:{host.port}
                  </div>
                </div>
                <Button size="sm" variant="secondary" disabled={connecting} onClick={() => void connectSaved(host)}>
                  {t('welcome.connect')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  )
}
