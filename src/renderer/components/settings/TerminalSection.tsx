import { Button } from '../ui/button'
import { Input } from '../ui/input'
import styles from '../../views/SettingsView.module.scss'

/** xterm 终端偏好设置；非 Windows 平台由父组件传入 `showWindowsShell={false}` 隐藏 Shell 下拉框。 */
interface TerminalSectionProps {
  labels: {
    title: string
    fontSize: string
    scrollback: string
    fontFamily: string
    cursorStyle: string
    cursorBlock: string
    cursorUnderline: string
    cursorBar: string
    windowsShell: string
    save: string
  }
  fontSize: number
  scrollback: number
  fontFamily: string
  cursorStyle: 'block' | 'underline' | 'bar'
  windowsShell: 'powershell' | 'cmd' | 'wsl'
  onFontSizeChange: (value: number) => void
  onScrollbackChange: (value: number) => void
  onFontFamilyChange: (value: string) => void
  onCursorStyleChange: (value: 'block' | 'underline' | 'bar') => void
  onWindowsShellChange: (value: 'powershell' | 'cmd' | 'wsl') => void
  onSave: () => void
}

export function TerminalSection({ showWindowsShell, labels, fontSize, scrollback, fontFamily, cursorStyle, windowsShell, onFontSizeChange, onScrollbackChange, onFontFamilyChange, onCursorStyleChange, onWindowsShellChange, onSave }: TerminalSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{labels.title}</h2>
      <div className={styles.fieldGroup}>
        <div>
          <label className={styles.fieldLabel} htmlFor="term-font">{labels.fontSize}</label>
          <Input id="term-font" type="number" min={10} max={32} value={fontSize} onChange={(event) => onFontSizeChange(Number(event.target.value) || 14)} />
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor="term-scroll">{labels.scrollback}</label>
          <Input id="term-scroll" type="number" min={1000} max={500000} step={1000} value={scrollback} onChange={(event) => onScrollbackChange(Number(event.target.value) || 5000)} />
        </div>
        <div className={styles.full}>
          <label className={styles.fieldLabel} htmlFor="term-ff">{labels.fontFamily}</label>
          <Input id="term-ff" value={fontFamily} onChange={(event) => onFontFamilyChange(event.target.value)} />
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor="term-cursor">{labels.cursorStyle}</label>
          <select id="term-cursor" value={cursorStyle} onChange={(event) => onCursorStyleChange(event.target.value as 'block' | 'underline' | 'bar')} className={styles.select}>
            <option value="block">{labels.cursorBlock}</option>
            <option value="underline">{labels.cursorUnderline}</option>
            <option value="bar">{labels.cursorBar}</option>
          </select>
        </div>
        {showWindowsShell ? (
          <div>
            <label className={styles.fieldLabel} htmlFor="term-shell">{labels.windowsShell}</label>
            <select id="term-shell" value={windowsShell} onChange={(event) => onWindowsShellChange(event.target.value as 'powershell' | 'cmd' | 'wsl')} className={styles.select}>
              <option value="powershell">PowerShell</option>
              <option value="cmd">cmd</option>
              <option value="wsl">WSL</option>
            </select>
          </div>
        ) : null}
        <Button type="button" variant="secondary" onClick={onSave}>{labels.save}</Button>
      </div>
    </section>
  )
}
