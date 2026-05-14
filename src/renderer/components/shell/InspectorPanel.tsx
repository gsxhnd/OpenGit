/**
 * Phase 0 — **Inspector Panel**：右侧属性 / 任务区。
 * 包含 Properties（连接详情）、Transfers（传输队列）、Diagnostics（诊断信息）标签。
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelRightClose, Server, FileUp, Bug } from 'lucide-react'
import { useAppStore } from '../../store'
import { Button } from '../ui/button'
import { ShellTooltip } from './ShellTooltip'
import styles from './InspectorPanel.module.scss'

type InspectorTab = 'properties' | 'transfers' | 'diagnostics'

interface InspectorPanelProps {
  onClose: () => void
}

const TAB_ITEMS: { key: InspectorTab; icon: typeof Server; labelKey: string }[] = [
  { key: 'properties', icon: Server, labelKey: 'workbench.inspectorTabProperties' },
  { key: 'transfers', icon: FileUp, labelKey: 'workbench.inspectorTabTransfers' },
  { key: 'diagnostics', icon: Bug, labelKey: 'workbench.inspectorTabDiagnostics' },
]

function PropertiesTab() {
  const { t } = useTranslation()
  const { sessions, activeSessionId } = useAppStore()
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

export function InspectorPanel({ onClose }: InspectorPanelProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<InspectorTab>('properties')

  return (
    <aside className={styles.inspector} aria-label={t('workbench.inspectorTitle')}>
      <header className={styles.header}>
        <span className={styles.title}>{t('workbench.inspectorTitle')}</span>
        <ShellTooltip content={t('workbench.inspectorClose')} side="bottom" delay={300}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('workbench.inspectorClose')}
          >
            <PanelRightClose size={16} />
          </Button>
        </ShellTooltip>
      </header>

      <nav className={styles.tabBar} aria-label="Inspector tabs">
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

      <div className={styles.body}>
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'transfers' && <TransfersTab />}
        {activeTab === 'diagnostics' && <DiagnosticsTab />}
      </div>
    </aside>
  )
}
