/**
 * Phase 0 — **Status Bar**：全局就绪状态、会话计数、当前活跃远程主机、协议与 Shell 类型。
 * 右侧提供 Inspector 切换与控制台消息入口。
 */
import { useTranslation } from 'react-i18next'
import { PanelRight, Search, Server, Terminal } from 'lucide-react'
import { useAppStore } from '../../store'
import { Button } from '../ui/button'
import { ShellTooltip } from './ShellTooltip'
import styles from './StatusBar.module.scss'

export function StatusBar() {
  const { t } = useTranslation()
  const { sessions, activeSessionId, inspectorOpen, toggleInspector, toggleCommandPalette } = useAppStore()
  const active = sessions.find((session) => session.connectionId === activeSessionId)

  return (
    <footer className={styles.statusBar} aria-label="Status Bar">
      <ShellTooltip content={t('workbench.status.commandPalette')} side="top" delay={400}>
        <button type="button" className={styles.item} onClick={toggleCommandPalette} aria-label={t('workbench.status.commandPalette')}>
          <Search size={12} />
          <span>Ctrl+Shift+P</span>
        </button>
      </ShellTooltip>

      <span className={styles.sep} aria-hidden />

      {active ? (
        <>
          <span className={styles.item}>
            <Server size={12} />
            <span className={styles.mono}>{active.host}:{active.port}</span>
          </span>
          <span className={styles.badge} data-protocol="ssh">SSH</span>
        </>
      ) : (
        <span className={styles.item}>{t('workbench.status.ready')}</span>
      )}

      <span className={styles.spacer} aria-hidden />

      <span className={styles.item}>
        <Terminal size={12} />
        <span>{t('workbench.status.sessions', { count: sessions.length })}</span>
      </span>

      <span className={styles.item}>
        <span className={styles.mono}>UTF-8</span>
      </span>

      <ShellTooltip content={t('workbench.inspectorToggleHint')} side="top" delay={400}>
        <Button
          type="button"
          variant={inspectorOpen ? 'secondary' : 'ghost'}
          size="xs"
          className={styles.inspectorBtn}
          onClick={() => toggleInspector()}
          aria-pressed={inspectorOpen}
          aria-label={t('workbench.inspectorToggle')}
        >
          <PanelRight size={14} className={styles.inspectorIcon} />
          <span className={styles.inspectorLabel}>{t('workbench.inspectorToggle')}</span>
        </Button>
      </ShellTooltip>
    </footer>
  )
}
