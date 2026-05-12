import { useNavigate } from 'react-router'
import { useAppStore } from '../store'
import { XtermPane } from '../components/XtermPane'
import { Button } from '../components/ui/button'
import styles from './LocalTerminalView.module.scss'

export function LocalTerminalView() {
  const navigate = useNavigate()
  const { settings } = useAppStore()
  const t = settings?.terminal

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <span className={styles.title}>Local shell</span>
      </header>
      <div className={styles.term}>
        <XtermPane
          mode={{ kind: 'local' }}
          fontSize={t?.fontSize ?? 14}
          fontFamily={t?.fontFamily ?? 'Menlo, Monaco, monospace'}
          scrollback={t?.scrollback ?? 5000}
        />
      </div>
    </div>
  )
}
