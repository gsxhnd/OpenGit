import { Button } from '../ui/button'
import styles from '../../views/SessionView.module.scss'

interface NewFolderDialogProps {
  value: string
  labels: {
    title: string
    placeholder: string
    cancel: string
    add: string
  }
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}

export function NewFolderDialog({ value, labels, onChange, onCancel, onSubmit }: NewFolderDialogProps) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.modalTitle}>{labels.title}</h3>
        <input
          className={styles.modalInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit()
            if (event.key === 'Escape') onCancel()
          }}
          placeholder={labels.placeholder}
          autoFocus
        />
        <div className={styles.modalActions}>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {labels.cancel}
          </Button>
          <Button size="sm" variant="secondary" onClick={onSubmit}>
            {labels.add}
          </Button>
        </div>
      </div>
    </div>
  )
}
