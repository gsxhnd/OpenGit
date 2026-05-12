import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useState, useEffect } from 'react'
import type { HostProfile } from '@shared/types'
import styles from './SettingsView.module.scss'

export function SettingsView() {
  const navigate = useNavigate()
  const { settings, loadSettings, updateSettings, addToast } = useAppStore()
  const [theme, setTheme] = useState(settings?.theme || 'Tokyo Night')

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
    if (settings?.theme) setTheme(settings.theme)
  }, [settings?.theme])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (settings) {
      void updateSettings({ ...settings, theme: newTheme })
    }
  }

  const saveTerminal = () => {
    if (!settings) return
    const fontSize = Number((document.getElementById('term-font') as HTMLInputElement)?.value) || settings.terminal.fontSize
    const scrollback = Number((document.getElementById('term-scroll') as HTMLInputElement)?.value) || settings.terminal.scrollback
    const fontFamily = (document.getElementById('term-ff') as HTMLInputElement)?.value || settings.terminal.fontFamily
    void updateSettings({
      ...settings,
      terminal: { ...settings.terminal, fontSize, scrollback, fontFamily },
    })
    addToast('Terminal settings saved', 'success')
  }

  const saveEditor = () => {
    if (!settings) return
    const fontSize = Number((document.getElementById('ed-font') as HTMLInputElement)?.value) || settings.editor.fontSize
    const tabSize = Number((document.getElementById('ed-tab') as HTMLInputElement)?.value) || settings.editor.tabSize
    const wordWrap = ((document.getElementById('ed-wrap') as HTMLInputElement)?.checked ? 'on' : 'off') as 'on' | 'off'
    const minimap = (document.getElementById('ed-mm') as HTMLInputElement)?.checked ?? settings.editor.minimap
    void updateSettings({
      ...settings,
      editor: { ...settings.editor, fontSize, tabSize, wordWrap, minimap },
    })
    addToast('Editor settings saved', 'success')
  }

  const addHost = async () => {
    if (!newLabel.trim() || !newHost.trim() || !newUser.trim()) {
      addToast('Label, host, and username required', 'error')
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
      addToast('Host saved', 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const removeHost = async (id: string) => {
    await window.api.hostsRemove(id)
    await loadSettings()
    addToast('Host removed', 'info')
  }

  if (!settings) {
    return <div className={styles.loading}>Loading…</div>
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
          ← Back
        </button>
        <h1 className={styles.headerTitle}>Settings</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <label className={styles.fieldLabel}>Theme</label>
          <select value={theme} onChange={(e) => handleThemeChange(e.target.value)} className={styles.select}>
            <option>Tokyo Night</option>
            <option>Dracula</option>
            <option>Nord</option>
            <option>Solarized Dark</option>
            <option>Solarized Light</option>
          </select>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Terminal (xterm)</h2>
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.fieldLabel} htmlFor="term-font">
                Font size
              </label>
              <Input id="term-font" type="number" min={10} max={32} defaultValue={settings.terminal.fontSize} />
            </div>
            <div>
              <label className={styles.fieldLabel} htmlFor="term-scroll">
                Scrollback
              </label>
              <Input id="term-scroll" type="number" min={1000} max={500000} step={1000} defaultValue={settings.terminal.scrollback} />
            </div>
            <div className={styles.full}>
              <label className={styles.fieldLabel} htmlFor="term-ff">
                Font family (CSS)
              </label>
              <Input id="term-ff" defaultValue={settings.terminal.fontFamily} />
            </div>
            <Button type="button" variant="secondary" onClick={saveTerminal}>
              Save terminal
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Editor (Monaco)</h2>
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.fieldLabel} htmlFor="ed-font">
                Font size
              </label>
              <Input id="ed-font" type="number" min={10} max={32} defaultValue={settings.editor.fontSize} />
            </div>
            <div>
              <label className={styles.fieldLabel} htmlFor="ed-tab">
                Tab size
              </label>
              <Input id="ed-tab" type="number" min={1} max={12} defaultValue={settings.editor.tabSize} />
            </div>
            <label className={styles.checkboxLabel}>
              <input id="ed-wrap" type="checkbox" defaultChecked={settings.editor.wordWrap === 'on'} />
              <span>Word wrap</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input id="ed-mm" type="checkbox" defaultChecked={settings.editor.minimap} />
              <span>Minimap</span>
            </label>
            <Button type="button" variant="secondary" onClick={saveEditor}>
              Save editor
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Remote hosts</h2>
          <p className={styles.hint}>Saved credentials stay in local config.json — use only on trusted machines.</p>
          <div className={styles.fieldGroup}>
            <Input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            <Input placeholder="Host" value={newHost} onChange={(e) => setNewHost(e.target.value)} />
            <Input placeholder="Port" value={newPort} onChange={(e) => setNewPort(e.target.value)} />
            <Input placeholder="Username" value={newUser} onChange={(e) => setNewUser(e.target.value)} />
            <select value={authType} onChange={(e) => setAuthType(e.target.value as 'password' | 'privateKey')} className={styles.select}>
              <option value="password">Password</option>
              <option value="privateKey">Private key file</option>
            </select>
            {authType === 'password' ? (
              <Input type="password" placeholder="Password (optional)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            ) : (
              <Input placeholder="Path to private key" value={newKeyPath} onChange={(e) => setNewKeyPath(e.target.value)} />
            )}
            <Button type="button" onClick={() => void addHost()}>
              Add host
            </Button>
          </div>
          <ul className={styles.hostList}>
            {settings.hosts.map((h) => (
              <li key={h.id} className={styles.hostRow}>
                <span>
                  {h.label} — {h.username}@{h.host}:{h.port}
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={() => void removeHost(h.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Shortcuts</h2>
          <div className={styles.shortcutList}>
            <div className={styles.shortcutItem}>
              <span>Command palette</span>
              <kbd className={styles.kbd}>⌘⇧P</kbd>
            </div>
            <div className={styles.shortcutItem}>
              <span>Settings</span>
              <kbd className={styles.kbd}>⌘,</kbd>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
