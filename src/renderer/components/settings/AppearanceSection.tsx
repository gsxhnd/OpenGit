import type { Language } from '../../i18n/translations'
import { THEME_NAMES } from '../../hooks/useTheme'
import styles from '../../views/SettingsView.module.scss'

interface AppearanceSectionProps {
  title: string
  themeLabel: string
  languageLabel: string
  theme: string
  language: Language
  onThemeChange: (theme: string) => void
  onLanguageChange: (language: Language) => void
}

export function AppearanceSection({ title, themeLabel, languageLabel, theme, language, onThemeChange, onLanguageChange }: AppearanceSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.fieldGroup}>
        <div>
          <label className={styles.fieldLabel}>{themeLabel}</label>
          <select value={theme} onChange={(event) => onThemeChange(event.target.value)} className={styles.select}>
            {THEME_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.fieldLabel}>{languageLabel}</label>
          <select value={language} onChange={(event) => onLanguageChange(event.target.value as Language)} className={styles.select}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>
    </section>
  )
}
