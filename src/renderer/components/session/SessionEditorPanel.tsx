import type { AppSettings, ToastKind } from '@shared/types'
import { RemoteMonacoEditor } from '../RemoteMonacoEditor'
import styles from '../../views/SessionView.module.scss'

interface SessionEditorPanelProps {
  editor: { path: string; text: string }
  ed: NonNullable<AppSettings['editor']>
  cid: string
  onClose: () => void
  onSaved: () => void
  addToast: (message: string, kind: ToastKind) => void
}

export function SessionEditorPanel({
  editor,
  ed,
  cid,
  onClose,
  onSaved,
  addToast,
}: SessionEditorPanelProps) {
  return (
    <div className={styles.editorArea}>
      <RemoteMonacoEditor
        key={editor.path}
        connectionId={cid}
        remotePath={editor.path}
        initialText={editor.text}
        fontSize={ed.fontSize}
        tabSize={ed.tabSize}
        wordWrap={ed.wordWrap}
        minimap={ed.minimap}
        onClose={onClose}
        onSaved={onSaved}
        addToast={addToast}
      />
    </div>
  )
}
