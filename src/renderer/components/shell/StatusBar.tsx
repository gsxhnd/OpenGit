/**
 * Phase 0 — **Status Bar**：全局就绪状态、会话计数、当前活跃远程主机；
 * 右侧提供 Inspector 切换（与 `InspectorPanel` 对应）。
 */
import { useTranslation } from 'react-i18next'
import { PanelRight } from 'lucide-react'
import { useAppStore } from '../../store'
import { Button } from '../ui/button'
import styles from './StatusBar.module.scss'

export function StatusBar() {
  const { t } = useTranslation()
  const { sessions, activeSessionId, inspectorOpen, toggleInspector } = useAppStore()
  const active = sessions.find((session) => session.connectionId === activeSessionId)

  return (
    <footer className={styles.statusBar} aria-label="Status Bar">
      <span>{t('workbench.status.ready')}</span>
      <span>{t('workbench.status.sessions', { count: sessions.length })}</span>
      <span>{active ? `${t('workbench.status.active')}: ${active.hostLabel}` : t('workbench.status.noActive')}</span>
      <span className={styles.spacer} aria-hidden />
      <Button
        type="button"
        variant={inspectorOpen ? 'secondary' : 'ghost'}
        size="xs"
        className={styles.inspectorBtn}
        onClick={() => toggleInspector()}
        aria-pressed={inspectorOpen}
        title={t('workbench.inspectorToggle')}
      >
        <PanelRight size={14} className={styles.inspectorIcon} />
        <span className={styles.inspectorLabel}>{t('workbench.inspectorToggle')}</span>
      </Button>
    </footer>
  )
}
