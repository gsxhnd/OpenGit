import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useState, useEffect } from 'react'
import type { HostProfile } from '@shared/types'
import type { Language } from '../i18n/translations'
import styles from './SettingsView.module.scss'

export function SettingsView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings, loadSettings, updateSettings, addToast, setLanguage, language } = useAppStore()

  const [theme, setTheme] = useState(settings?.theme || 'Tokyo Night')
  const [selectedLang, setSelectedLang] = useState<Language>(language)

  const [termFontSize, setTermFontSize] = useState(settings?.terminal.fontSize ?? 14)
  const [termScrollback, setTermScrollback] = useState(settings?.terminal.scrollback ?? 5000)
  const [termFontFamily, setTermFontFamily] = useState(settings?.terminal.fontFamily ?? 'Menlo, Monaco, "Courier New", monospace')

  const [edFontSize, setEdFontSize] = useState(settings?.editor.fontSize ?? 14)
  const [edTabSize, setEdTabSize] = useState(settings?.editor.tabSize ?? 2)
  const [edWordWrap, setEdWordWrap] = useState(settings?.editor.wordWrap === 'on')
  const [edMinimap, setEdMinimap] = useState(settings?.editor.minimap ?? true)

  const [newLabel, setNewLabel] = useState('')
  const [newHost, setNewHost] = useState('')
  const [newPort, setNewPort] = useState('22')
  const [newUser, setNewUser] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newKeyPath, setNewKeyPath] = useState('')
  const [authType, setAuthType] = useState<'password' | 'privateKey'>('password')

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme)
      setTermFontSize(settings.terminal.fontSize)
      setTermScrollback(settings.terminal.scrollback)
      setTermFontFamily(settings.terminal.fontFamily)
      setEdFontSize(settings.editor.fontSize)
      setEdTabSize(settings.editor.tabSize)
      setEdWordWrap(settings.editor.wordWrap === 'on')
      setEdMinimap(settings.editor.minimap)
    }
  }, [settings])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (settings) {
      void updateSettings({ ...settings, theme: newTheme })
    }
  }

  const handleLanguageChange = (lang: Language) => {
    setSelectedLang(lang)
    void setLanguage(lang)
    addToast(t('settings.languageChanged'), 'success')
  }

  const saveTerminal = () => {
    if (!settings) return
    void updateSettings({
      ...settings,
      terminal: { fontSize: termFontSize, scrollback: termScrollback, fontFamily: termFontFamily },
    })
    addToast(t('settings.terminalSaved'), 'success')
  }

  const saveEditor = () => {
    if (!settings) return
    void updateSettings({
      ...settings,
      editor: {
        fontSize: edFontSize,
        tabSize: edTabSize,
        wordWrap: edWordWrap ? 'on' : 'off',
        minimap: edMinimap,
      },
    })
    addToast(t('settings.editorSaved'), 'success')
  }

  const addHost = async () => {
    if (!newLabel.trim() || !newHost.trim() || !newUser.trim()) {
      addToast(t('settings.labelHostUsernameRequired'), 'error')
      return
    }
    const host: Omit<HostProfile, 'id'> = {
      label: newLabel.trim(),
      host: newHost.trim(),
      port: Number(newPort) || 22,
      username: newUser.trim(),
      authType,
      password: authType === 'password' ? newPassword || undefined : undefined,
      privateKeyPath: authType === 'privateKey' ? newKeyPath || undefined : undefined,
    }
    try {
      await window.api.hostsAdd(host)
      setNewLabel('')
      setNewHost('')
      setNewUser('')
      setNewPassword('')
      setNewKeyPath('')
      await loadSettings()
      addToast(t('settings.hostSaved'), 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('err.saveFailed'), 'error')
    }
  }

  const removeHost = async (id: string) => {
    await window.api.hostsRemove(id)
    await loadSettings()
    addToast(t('settings.hostRemoved'), 'info')
  }

  if (!settings) {
    return <div className={styles.loading}>{t('ui.loading')}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.container}
    >
      <div className={styles.header}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backButton}>
          {t('ui.back')}
        </button>
        <h1 className={styles.headerTitle}>{t('settings.title')}</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings.appearance')}</h2>
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.fieldLabel}>{t('settings.theme')}</label>
              <select value={theme} onChange={(e) => handleThemeChange(e.target.value)} className={styles.select}>
                <option>Tokyo Night</option>
                <option>Dracula</option>
                <option>Nord</option>
                <option>Solarized Dark</option>
                <option>Solarized Light</option>
              </select>
            </div>
            <div>
              <label className={styles.fieldLabel}>{t('settings.language')}</label>
              <select value={selectedLang} onChange={(e) => handleLanguageChange(e.target.value as Language)} className={styles.select}>
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings.terminal')}</h2>
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.fieldLabel} htmlFor="term-font">
                {t('settings.terminalFontSize')}
              </label>
              <Input id="term-font" type="number" min={10} max={32} value={termFontSize} onChange={(e) => setTermFontSize(Number(e.target.value) || 14)} />
            </div>
            <div>
              <label className={styles.fieldLabel} htmlFor="term-scroll">
                {t('settings.terminalScrollback')}
              </label>
              <Input id="term-scroll" type="number" min={1000} max={500000} step={1000} value={termScrollback} onChange={(e) => setTermScrollback(Number(e.target.value) || 5000)} />
            </div>
            <div className={styles.full}>
              <label className={styles.fieldLabel} htmlFor="term-ff">
                {t('settings.terminalFontFamily')}
              </label>
              <Input id="term-ff" value={termFontFamily} onChange={(e) => setTermFontFamily(e.target.value)} />
            </div>
            <Button type="button" variant="secondary" onClick={saveTerminal}>
              {t('settings.saveTerminal')}
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings.editor')}</h2>
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.fieldLabel} htmlFor="ed-font">
                {t('settings.editorFontSize')}
              </label>
              <Input id="ed-font" type="number" min={10} max={32} value={edFontSize} onChange={(e) => setEdFontSize(Number(e.target.value) || 14)} />
            </div>
            <div>
              <label className={styles.fieldLabel} htmlFor="ed-tab">
                {t('settings.editorTabSize')}
              </label>
              <Input id="ed-tab" type="number" min={1} max={12} value={edTabSize} onChange={(e) => setEdTabSize(Number(e.target.value) || 2)} />
            </div>
            <label className={styles.checkboxLabel}>
              <input id="ed-wrap" type="checkbox" checked={edWordWrap} onChange={(e) => setEdWordWrap(e.target.checked)} />
              <span>{t('settings.editorWordWrap')}</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input id="ed-mm" type="checkbox" checked={edMinimap} onChange={(e) => setEdMinimap(e.target.checked)} />
              <span>{t('settings.editorMinimap')}</span>
            </label>
            <Button type="button" variant="secondary" onClick={saveEditor}>
              {t('settings.saveEditor')}
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings.remoteHosts')}</h2>
          <p className={styles.hint}>{t('settings.remoteHostsHint')}</p>
          <div className={styles.fieldGroup}>
            <Input placeholder={t('settings.label')} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            <Input placeholder={t('settings.host')} value={newHost} onChange={(e) => setNewHost(e.target.value)} />
            <Input placeholder={t('settings.port')} value={newPort} onChange={(e) => setNewPort(e.target.value)} />
            <Input placeholder={t('settings.username')} value={newUser} onChange={(e) => setNewUser(e.target.value)} />
            <select value={authType} onChange={(e) => setAuthType(e.target.value as 'password' | 'privateKey')} className={styles.select}>
              <option value="password">{t('settings.authTypePassword')}</option>
              <option value="privateKey">{t('settings.authTypePrivateKey')}</option>
            </select>
            {authType === 'password' ? (
              <Input type="password" placeholder={t('settings.password')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            ) : (
              <Input placeholder={t('settings.keyPath')} value={newKeyPath} onChange={(e) => setNewKeyPath(e.target.value)} />
            )}
            <Button type="button" onClick={() => void addHost()}>
              {t('settings.addHost')}
            </Button>
          </div>
          <ul className={styles.hostList}>
            {settings.hosts.map((h) => (
              <li key={h.id} className={styles.hostRow}>
                <span>
                  {h.label} — {h.username}@{h.host}:{h.port}
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={() => void removeHost(h.id)}>
                  {t('settings.remove')}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings.shortcuts')}</h2>
          <div className={styles.shortcutList}>
            <div className={styles.shortcutItem}>
              <span>{t('settings.commandPalette')}</span>
              <kbd className={styles.kbd}>⌘⇧P</kbd>
            </div>
            <div className={styles.shortcutItem}>
              <span>{t('settings.title')}</span>
              <kbd className={styles.kbd}>⌘,</kbd>
            </div>
            <div className={styles.shortcutItem}>
              <span>{t('nav.home')}</span>
              <kbd className={styles.kbd}>⌘1</kbd>
            </div>
            <div className={styles.shortcutItem}>
              <span>{t('nav.localShell')}</span>
              <kbd className={styles.kbd}>⌘2</kbd>
            </div>
            <div className={styles.shortcutItem}>
              <span>{t('nav.settings')}</span>
              <kbd className={styles.kbd}>⌘3</kbd>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
