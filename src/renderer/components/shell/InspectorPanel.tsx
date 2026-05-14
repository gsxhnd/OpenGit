/**
 * Phase 0 — **Inspector** 占位：信息架构中的右侧属性 / 任务区（见 docs/dev/05-information-architecture.md）。
 * 后续可挂载 SFTP 传输详情、主机属性、诊断日志等；当前仅展示说明与关闭入口。
 */
import { useTranslation } from 'react-i18next'
import { PanelRightClose } from 'lucide-react'
import { Button } from '../ui/button'
import styles from './InspectorPanel.module.scss'

interface InspectorPanelProps {
  onClose: () => void
}

export function InspectorPanel({ onClose }: InspectorPanelProps) {
  const { t } = useTranslation()

  return (
    <aside className={styles.inspector} aria-label={t('workbench.inspectorTitle')}>
      <header className={styles.header}>
        <span className={styles.title}>{t('workbench.inspectorTitle')}</span>
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
      </header>
      <div className={styles.body}>
        <p className={styles.placeholder}>{t('workbench.inspectorPlaceholder')}</p>
      </div>
    </aside>
  )
}
