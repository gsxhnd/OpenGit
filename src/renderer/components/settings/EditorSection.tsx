import { Button } from '../ui/button'
import { Input } from '../ui/input'
import styles from '../../views/SettingsView.module.scss'

interface EditorSectionProps {
  labels: {
    title: string
    fontSize: string
    tabSize: string
    wordWrap: string
    minimap: string
    save: string
  }
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  onFontSizeChange: (value: number) => void
  onTabSizeChange: (value: number) => void
  onWordWrapChange: (value: boolean) => void
  onMinimapChange: (value: boolean) => void
  onSave: () => void
}

export function EditorSection({ labels, fontSize, tabSize, wordWrap, minimap, onFontSizeChange, onTabSizeChange, onWordWrapChange, onMinimapChange, onSave }: EditorSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{labels.title}</h2>
      <div className={styles.fieldGroup}>
        <div>
          <label className={styles.fieldLabel} htmlFor="ed-font">{labels.fontSize}</label>
          <Input id="ed-font" type="number" min={10} max={32} value={fontSize} onChange={(event) => onFontSizeChange(Number(event.target.value) || 14)} />
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor="ed-tab">{labels.tabSize}</label>
          <Input id="ed-tab" type="number" min={1} max={12} value={tabSize} onChange={(event) => onTabSizeChange(Number(event.target.value) || 2)} />
        </div>
        <label className={styles.checkboxLabel}>
          <input id="ed-wrap" type="checkbox" checked={wordWrap} onChange={(event) => onWordWrapChange(event.target.checked)} />
          <span>{labels.wordWrap}</span>
        </label>
        <label className={styles.checkboxLabel}>
          <input id="ed-mm" type="checkbox" checked={minimap} onChange={(event) => onMinimapChange(event.target.checked)} />
          <span>{labels.minimap}</span>
        </label>
        <Button type="button" variant="secondary" onClick={onSave}>{labels.save}</Button>
      </div>
    </section>
  )
}
