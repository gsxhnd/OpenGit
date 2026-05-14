import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import styles from './StatusBar.module.scss'

export function StatusBar() {
  const { t } = useTranslation()
  const { sessions, activeSessionId } = useAppStore()
  const active = sessions.find((session) => session.connectionId === activeSessionId)

  return (
    <footer className={styles.statusBar} aria-label="Status Bar">
      <span>{t('workbench.status.ready')}</span>
      <span>{t('workbench.status.sessions', { count: sessions.length })}</span>
      <span>{active ? `${t('workbench.status.active')}: ${active.hostLabel}` : t('workbench.status.noActive')}</span>
    </footer>
  )
}
