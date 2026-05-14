import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Button } from '../components/ui/button'
import { useAppStore } from '../store'
import styles from './FilesView.module.scss'

const localRows = [
  { name: 'project', size: '--', modified: 'local' },
  { name: 'backup.tar.gz', size: '128M', modified: 'queued' },
  { name: 'README.md', size: '12K', modified: 'today' },
]

export function FilesView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sessions } = useAppStore()
  const active = sessions[0]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('workbench.files')}</h1>
          <p className={styles.subtitle}>{t('workbench.filesHint')}</p>
        </div>
        {active && (
          <Button variant="secondary" onClick={() => navigate(`/session/${active.connectionId}`)}>
            {t('workbench.openRemoteFiles')}
          </Button>
        )}
      </header>

      <div className={styles.workbench}>
        <section className={styles.pane}>
          <header className={styles.paneHeader}>
            <span className={styles.paneTitle}>{t('workbench.localFiles')}</span>
            <span className={styles.path}>~/</span>
          </header>
          <div className={styles.fileList}>
            {localRows.map((row) => (
              <div key={row.name} className={styles.fileRow}>
                <span>{row.name}</span>
                <span className={styles.fileMeta}>{row.size}</span>
                <span className={styles.fileMeta}>{row.modified}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.pane}>
          <header className={styles.paneHeader}>
            <span className={styles.paneTitle}>{t('workbench.remoteFiles')}</span>
            <span className={styles.path}>{active ? `${active.host}: /` : t('workbench.noActiveSessions')}</span>
          </header>
          <div className={styles.fileList}>
            {active ? (
              <Button variant="outline" onClick={() => navigate(`/session/${active.connectionId}`)}>
                {t('workbench.openRemoteFiles')}
              </Button>
            ) : (
              <div className={styles.queueBody}>{t('workbench.noRemoteFiles')}</div>
            )}
          </div>
        </section>
      </div>

      <section className={styles.queue}>
        <header className={styles.queueHeader}>
          <span className={styles.queueTitle}>{t('workbench.transferQueue')}</span>
          <span className={styles.path}>0 {t('workbench.tasks')}</span>
        </header>
        <div className={styles.queueBody}>{t('workbench.transferQueueEmpty')}</div>
      </section>
    </motion.div>
  )
}
