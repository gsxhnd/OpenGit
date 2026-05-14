/**
 * Phase 0 — **Session Tabs**：数据由 `buildWorkbenchSessionTabs` 生成（本地 + SSH），
 * 与 `@shared/types` 的 `WorkbenchSessionTabModel` 对齐。
 * 支持动态状态显示、shadcn ContextMenu、智能关闭导航（跳至最近兄弟标签）。
 */
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { X, SquareX, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store'
import { buildWorkbenchSessionTabs, isWorkbenchTabActive } from '../../lib/workbenchSessionTabs'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../ui/context-menu'
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
    const remaining = tabs.filter((t) => t.id !== connectionId && t.id !== '__puck_local_terminal__')
    if (location.pathname === `/session/${connectionId}`) {
      if (remaining.length > 0) {
        navigate(remaining[0].routePath)
      } else {
        navigate('/local-terminal')
      }
    }
  }

  const closeOtherTabs = async (connectionId: string) => {
    const others = tabs.filter((t) => t.closable && t.connectionId !== connectionId)
    for (const tab of others) {
      await window.api.sshDisconnect(tab.connectionId)
      removeSession(tab.connectionId)
    }
  }

  const closeAllTabs = async () => {
    const closable = tabs.filter((t) => t.closable)
    for (const tab of closable) {
      await window.api.sshDisconnect(tab.connectionId)
      removeSession(tab.connectionId)
    }
    navigate('/')
  }

  return (
    <div className={styles.tabs} aria-label={t('workbench.sessionTabs')}>
      {tabs.map((tab) => {
        const active = isWorkbenchTabActive(tab, location.pathname)
        const tabBody = (
          <div key={tab.id} className={active ? styles.tabActive : styles.tab}>
            <ShellTooltip content={tab.title} side="bottom" delay={350}>
              <button type="button" className={styles.tabTrigger} onClick={() => navigate(tab.routePath)}>
                <span className={styles.tabTitle}>{tab.title}</span>
                <span className={styles.tabStatus} data-state={tab.status} aria-hidden />
              </button>
            </ShellTooltip>
            {tab.closable ? (
              <ShellTooltip content={t('workbench.closeSessionTab')} side="bottom" delay={350}>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => { void closeRemoteSession(tab.connectionId) }}
                  aria-label={t('workbench.closeSessionTab')}
                >
                  <X size={12} />
                </button>
              </ShellTooltip>
            ) : null}
          </div>
        )

        if (!tab.closable) return tabBody

        return (
          <ContextMenu key={tab.id}>
            <ContextMenuTrigger className={styles.tabTrigger as string}>
              {tabBody}
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => { void closeRemoteSession(tab.connectionId) }}>
                <X size={14} />
                {t('workbench.closeSessionTab')}
                <ContextMenuShortcut>^W</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => { void closeOtherTabs(tab.connectionId) }}>
                <SquareX size={14} />
                {t('workbench.closeOtherTabs')}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => { void closeAllTabs() }}>
                <Trash2 size={14} />
                {t('workbench.closeAllTabs')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </div>
  )
}
