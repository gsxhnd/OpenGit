import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useAppStore } from '../../store'
import styles from './SessionTabs.module.scss'

export function SessionTabs() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { sessions, removeSession, activeSessionId } = useAppStore()

  const isLocalActive = location.pathname.startsWith('/local-terminal')

  const closeRemoteSession = async (connectionId: string) => {
    await window.api.sshDisconnect(connectionId)
    removeSession(connectionId)
    if (location.pathname === `/session/${connectionId}`) {
      navigate('/')
    }
  }

  return (
    <div className={styles.tabs} aria-label={t('workbench.sessionTabs')}>
      <button type="button" className={isLocalActive ? styles.tabActive : styles.tab} onClick={() => navigate('/local-terminal')}>
        {t('nav.localShell')}
      </button>
      {sessions.map((session) => {
        const active = activeSessionId === session.connectionId || location.pathname === `/session/${session.connectionId}`
        return (
          <div key={session.connectionId} className={active ? styles.tabActive : styles.tab}>
            <button type="button" className={styles.tabTrigger} onClick={() => navigate(`/session/${session.connectionId}`)}>
              {session.hostLabel}
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => void closeRemoteSession(session.connectionId)}
              aria-label={t('ui.close')}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
