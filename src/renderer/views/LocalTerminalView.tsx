/**
 * 本地 PTY 会话视图（Phase 1 — 与 `SessionView` 共用 `TerminalPanel` / `XtermPane`）。
 * 子进程退出后提供「新建 Shell」以重新挂载终端，无需离开路由。
 */
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { TerminalPanel } from '../components/terminal/TerminalPanel'
import { Button } from '../components/ui/button'
import styles from './LocalTerminalView.module.scss'

export function LocalTerminalView() {
  const { t } = useTranslation()
  const { settings } = useAppStore()
  const term = settings?.terminal
  /** 递增 key 以在 PTY 退出后强制重新挂载 `XtermPane`，从而再次调用 `ptyLocalCreate`。 */
  const [terminalKey, setTerminalKey] = useState(0)
  const [localExited, setLocalExited] = useState(false)

  const spawnNewLocalShell = useCallback(() => {
    setLocalExited(false)
    setTerminalKey((k) => k + 1)
  }, [])

  return (
    <div className={styles.wrap}>
      {localExited ? (
        <div className={styles.exitedBar} role="status">
          <span className={styles.exitedHint}>{t('localTerminal.exitedHint')}</span>
          <Button type="button" size="sm" variant="secondary" onClick={spawnNewLocalShell}>
            {t('localTerminal.restart')}
          </Button>
        </div>
      ) : null}
      <div className={styles.term}>
        {!localExited ? (
          <TerminalPanel
            key={terminalKey}
            mode={{ kind: 'local' }}
            title={t('localTerminal.title')}
            protocol="Local"
            status="connected"
            settings={term}
            onExit={() => setLocalExited(true)}
          />
        ) : null}
      </div>
    </div>
  )
}
