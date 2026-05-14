import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { TerminalPanel } from '../components/terminal/TerminalPanel'
import styles from './LocalTerminalView.module.scss'

export function LocalTerminalView() {
  const { t } = useTranslation()
  const { settings } = useAppStore()
  const term = settings?.terminal

  return (
    <div className={styles.wrap}>
      <div className={styles.term}>
        <TerminalPanel
          mode={{ kind: 'local' }}
          title={t('localTerminal.title')}
          protocol="Local"
          status="connected"
          settings={term}
          onExit={() => undefined}
        />
      </div>
    </div>
  )
}
