import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { XtermPane } from '../components/XtermPane'
import { Button } from '../components/ui/button'
import styles from './LocalTerminalView.module.scss'

export function LocalTerminalView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings } = useAppStore()
  const term = settings?.terminal

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          {t('ui.back')}
        </Button>
        <span className={styles.title}>{t('localTerminal.title')}</span>
      </header>
      <div className={styles.term}>
        <XtermPane
          mode={{ kind: 'local' }}
          fontSize={term?.fontSize ?? 14}
          fontFamily={term?.fontFamily ?? 'Menlo, Monaco, monospace'}
          scrollback={term?.scrollback ?? 5000}
        />
      </div>
    </div>
  )
}
