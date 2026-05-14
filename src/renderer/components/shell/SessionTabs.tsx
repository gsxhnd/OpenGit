/**
 * Phase 0 — **Session Tabs**：数据由 `buildWorkbenchSessionTabs` 生成（本地 + SSH），
 * 与 `@shared/types` 的 `WorkbenchSessionTabModel` 对齐，便于后续加入仅 SFTP 等 Tab 类型。
 */
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useAppStore } from '../../store'
import { buildWorkbenchSessionTabs, isWorkbenchTabActive } from '../../lib/workbenchSessionTabs'
import { ShellTooltip } from './ShellTooltip'
import styles from './SessionTabs.module.scss'

export function SessionTabs() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { sessions, removeSession } = useAppStore()

  const tabs = useMemo(
    () => buildWorkbenchSessionTabs(sessions, t('nav.localShell')),
    [sessions, t],
  )

  const closeRemoteSession = async (connectionId: string) => {
    await window.api.sshDisconnect(connectionId)
    removeSession(connectionId)
    if (location.pathname === `/session/${connectionId}`) {
      navigate('/')
    }
  }

  return (
    <div className={styles.tabs} aria-label={t('workbench.sessionTabs')}>
      {tabs.map((tab) => {
        const active = isWorkbenchTabActive(tab, location.pathname)
        return (
          <div key={tab.id} className={active ? styles.tabActive : styles.tab}>
            <ShellTooltip content={tab.title} side="bottom" delay={350}>
              <button type="button" className={styles.tabTrigger} onClick={() => navigate(tab.routePath)}>
                <span className={styles.tabTitle}>{tab.title}</span>
                {tab.status !== 'connected' ? (
                  <span className={styles.tabStatus} data-state={tab.status} aria-hidden />
                ) : null}
              </button>
            </ShellTooltip>
            {tab.closable ? (
              <ShellTooltip content={t('workbench.closeSessionTab')} side="bottom" delay={350}>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => void closeRemoteSession(tab.connectionId)}
                  aria-label={t('workbench.closeSessionTab')}
                >
                  <X size={12} />
                </button>
              </ShellTooltip>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
