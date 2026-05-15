/**
 * SecondPanel — optional right panel (formerly InspectorPanel).
 * Has its own header. On Win/Linux, window controls appear in this header
 * when the panel is open (they move here from MainHeader).
 *
 * Contains Properties (connection details), Transfers, Diagnostics tabs.
 * Toggled via `secondPanelOpen` in the Zustand UiSlice.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelRightClose, Server, FileUp, Bug } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../store'
import { Button } from '../ui/button'
import { ShellTooltip } from './ShellTooltip'
import { WinControlButtons } from './WinControlButtons'
import styles from './SecondPanel.module.scss'

const isMac = (window.api as { platform?: string }).platform === 'darwin'

type SecondPanelTab = 'properties' | 'transfers' | 'diagnostics'

interface SecondPanelProps {
  onClose: () => void
}

const TAB_ITEMS: { key: SecondPanelTab; icon: typeof Server; labelKey: string }[] = [
  { key: 'properties', icon: Server, labelKey: 'workbench.inspectorTabProperties' },
  { key: 'transfers', icon: FileUp, labelKey: 'workbench.inspectorTabTransfers' },
  { key: 'diagnostics', icon: Bug, labelKey: 'workbench.inspectorTabDiagnostics' },
]

function PropertiesTab() {
  const { t } = useTranslation()
  const { sessions, activeSessionId } = useAppStore(useShallow((s) => ({ sessions: s.sessions, activeSessionId: s.activeSessionId })))
  const active = sessions.find((s) => s.connectionId === activeSessionId)

  if (!active) {
    return <p className={styles.placeholder}>{t('workbench.inspectorNoConnection')}</p>
  }

  return (
    <dl className={styles.propertiesList}>
      <div className={styles.propertyRow}>
        <dt>{t('welcome.host')}</dt>
        <dd>{active.host}</dd>
      </div>
      <div className={styles.propertyRow}>
        <dt>{t('welcome.port')}</dt>
        <dd>{active.port}</dd>
      </div>
      <div className={styles.propertyRow}>
        <dt>{t('welcome.username')}</dt>
        <dd>{active.username}</dd>
      </div>
      {active.fingerprint && (
        <div className={styles.propertyRow}>
          <dt>Fingerprint</dt>
          <dd className={styles.mono}>{active.fingerprint}</dd>
        </div>
      )}
      <div className={styles.propertyRow}>
        <dt>{t('workbench.status.protocol')}</dt>
        <dd>SSH</dd>
      </div>
      <div className={styles.propertyRow}>
        <dt>Status</dt>
        <dd className={active.status === 'connected' ? styles.statusConnected : styles.statusOther}>
          {active.status}
        </dd>
      </div>
    </dl>
  )
}

function TransfersTab() {
  const { t } = useTranslation()
  return (
    <p className={styles.placeholder}>
      {t('workbench.transferQueueEmpty')}
    </p>
  )
}

function DiagnosticsTab() {
  const { t } = useTranslation()
  return (
    <p className={styles.placeholder}>
      {t('workbench.inspectorNoContent')}
    </p>
  )
}

export function SecondPanel({ onClose }: SecondPanelProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SecondPanelTab>('properties')

  const height = isMac ? 'h-[38px]' : 'h-[32px]'

  return (
    <aside className={styles.panel} aria-label={t('workbench.secondPanelTitle')}>
      {/* Second Panel Header */}
      <header className={`drag-region flex shrink-0 items-stretch border-b border-[var(--color-border)] ${height}`}>
        <div className="no-drag flex shrink-0 items-center pl-2">
          <ShellTooltip content={t('workbench.secondPanelClose')} side="bottom" delay={300}>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              aria-label={t('workbench.secondPanelClose')}
            >
              <PanelRightClose size={16} />
            </Button>
          </ShellTooltip>
        </div>
        <div className="pointer-events-none flex flex-1 items-center px-2">
          <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {t('workbench.secondPanelTitle')}
          </span>
        </div>
        {/* Win/Linux: window controls in the rightmost panel */}
        {!isMac && <WinControlButtons />}
      </header>

      {/* Tabs */}
      <nav className={styles.tabBar} aria-label="Second panel tabs">
        {TAB_ITEMS.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(key)}
            aria-selected={activeTab === key}
          >
            <Icon size={14} />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Body */}
      <div className={styles.body}>
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'transfers' && <TransfersTab />}
        {activeTab === 'diagnostics' && <DiagnosticsTab />}
      </div>
    </aside>
  )
}
