import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '../components/ui/button'
import { useSshConnect } from '../hooks/connection/useSshConnect'
import styles from './ConnectionsView.module.scss'

export function ConnectionsView() {
  const { t } = useTranslation()
  const { settings, loadSettings, setAddHostOpen, addToast } = useAppStore(
    useShallow((s) => ({
      settings: s.settings,
      loadSettings: s.loadSettings,
      setAddHostOpen: s.setAddHostOpen,
      addToast: s.addToast,
    })),
  )
  const { connectSaved, connecting } = useSshConnect()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const hosts = settings?.hosts ?? []

  const handleRemove = async (id: string) => {
    await window.api.hostsRemove(id)
    await loadSettings()
    addToast(t('settings.hostRemoved'), 'info')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
      <div className={styles.panelHead}>
        <h1 className={styles.title}>{t('workbench.connections')}</h1>
        <Button variant="secondary" size="sm" onClick={() => setAddHostOpen(true)}>
          <Plus size={14} className="mr-1" />
          {t('settings.addHost')}
        </Button>
      </div>

      {hosts.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('workbench.noSavedConnections')}</p>
          <Button variant="outline" size="sm" className={styles.emptyAction} onClick={() => setAddHostOpen(true)}>
            <Plus size={14} className="mr-1" />
            {t('settings.addHost')}
          </Button>
        </div>
      ) : (
        <ul className={styles.hostList}>
          {hosts.map((host) => (
            <li key={host.id} className={styles.hostItem}>
              <div className={styles.hostInfo}>
                <div className={styles.hostName}>{host.label}</div>
                <div className={styles.hostMeta}>
                  {host.username}@{host.host}:{host.port}
                </div>
              </div>
              <div className={styles.hostActions}>
                <Button size="sm" variant="secondary" disabled={connecting} onClick={() => void connectSaved(host)}>
                  {t('welcome.connect')}
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => void handleRemove(host.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
