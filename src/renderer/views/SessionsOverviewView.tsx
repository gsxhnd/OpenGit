import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Button } from '../components/ui/button'
import { useAppStore } from '../store'
import styles from './SessionsOverviewView.module.scss'

export function SessionsOverviewView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sessions = useAppStore((s) => s.sessions)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('workbench.sessions')}</h1>
          <p className={styles.subtitle}>{t('workbench.sessionsHint')}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/local-terminal')}>
          {t('welcome.localTerminal')}
        </Button>
      </header>

      <div className={styles.grid}>
        <article className={styles.card}>
          <div>
            <div className={styles.cardTitle}>{t('nav.localShell')}</div>
            <div className={styles.cardMeta}>local://shell</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/local-terminal')}>
            {t('workbench.openSession')}
          </Button>
        </article>

        {sessions.map((session) => (
          <article key={session.connectionId} className={styles.card}>
            <div>
              <div className={styles.status} data-status={session.status ?? 'connected'}>
                {session.status ?? t('workbench.connected')}
              </div>
              <div className={styles.cardTitle}>{session.hostLabel}</div>
              <div className={styles.cardMeta}>{session.username}@{session.host}:{session.port}</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/session/${session.connectionId}`)}>
              {t('workbench.openSession')}
            </Button>
          </article>
        ))}
      </div>

      {sessions.length === 0 && <div className={styles.empty}>{t('workbench.noActiveSessions')}</div>}
    </motion.div>
  )
}
