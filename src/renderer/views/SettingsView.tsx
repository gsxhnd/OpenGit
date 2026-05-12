import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useState } from 'react'
import styles from './SettingsView.module.scss'

export function SettingsView() {
  const { settings, updateSettings } = useAppStore()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(settings?.theme || 'Tokyo Night')

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (settings) {
      updateSettings({ ...settings, theme: newTheme })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          ← Back
        </button>
        <h1 className={styles.headerTitle}>Settings</h1>
      </div>

      {/* Settings content */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          {/* Appearance */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <div className={styles.fieldGroup}>
              <div>
                <label className={styles.fieldLabel}>Theme</label>
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className={styles.select}
                >
                  <option>Tokyo Night</option>
                  <option>Dracula</option>
                  <option>Nord</option>
                  <option>Solarized Dark</option>
                  <option>Solarized Light</option>
                </select>
              </div>
            </div>
          </section>

          {/* Editor */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Editor</h2>
            <div className={styles.fieldGroup}>
              <div>
                <label className={styles.fieldLabel}>Font Size</label>
                <Input
                  type="number"
                  min="10"
                  max="20"
                  defaultValue="12"
                  className="w-24"
                />
              </div>
              <div>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" defaultChecked className={styles.checkbox} />
                  <span className={styles.checkboxText}>Word Wrap</span>
                </label>
              </div>
            </div>
          </section>

          {/* Git */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Git</h2>
            <div className={styles.fieldGroup}>
              <div>
                <label className={styles.fieldLabel}>Default Commit Message</label>
                <Input
                  placeholder="Enter default commit message template"
                  className="w-full"
                />
              </div>
              <div>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" defaultChecked className={styles.checkbox} />
                  <span className={styles.checkboxText}>Auto-fetch on startup</span>
                </label>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Keyboard Shortcuts</h2>
            <div className={styles.shortcutList}>
              <div className={styles.shortcutItem}>
                <span>Go to Commit View</span>
                <kbd className={styles.kbd}>Ctrl+1</kbd>
              </div>
              <div className={styles.shortcutItem}>
                <span>Go to History View</span>
                <kbd className={styles.kbd}>Ctrl+2</kbd>
              </div>
              <div className={styles.shortcutItem}>
                <span>Go to Branches View</span>
                <kbd className={styles.kbd}>Ctrl+3</kbd>
              </div>
              <div className={styles.shortcutItem}>
                <span>Go to Graph View</span>
                <kbd className={styles.kbd}>Ctrl+4</kbd>
              </div>
              <div className={styles.shortcutItem}>
                <span>Stage All</span>
                <kbd className={styles.kbd}>Ctrl+Shift+A</kbd>
              </div>
              <div className={styles.shortcutItem}>
                <span>Unstage All</span>
                <kbd className={styles.kbd}>Ctrl+Shift+U</kbd>
              </div>
              <div className={styles.shortcutItemLast}>
                <span>Command Palette</span>
                <kbd className={styles.kbd}>Ctrl+Shift+P</kbd>
              </div>
            </div>
          </section>

          {/* About */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>About</h2>
            <div className={styles.aboutContent}>
              <p>OpenGit v1.0.0</p>
              <p>A modern Git client for developers</p>
              <p className={styles.aboutLink}>
                <a href="#">
                  GitHub Repository
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  )
}
