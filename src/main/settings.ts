import { app, ipcMain } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/ipc'
import { AppSettings } from '../shared/types'

const CONFIG_DIR = join(app.getPath('userData'))
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const THEMES_DIR = join(app.getAppPath(), 'themes')

const DEFAULT_SETTINGS: AppSettings = {
  window: { width: 1100, height: 720 },
  recentRepos: [],
  theme: 'Tokyo Night',
  workspace: {
    entries: [],
    groups: [],
    activeIndex: 0,
  },
}

export function loadSettings(): AppSettings {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
    // Backup corrupted file
    try {
      const backupPath = CONFIG_FILE + '.bak'
      if (existsSync(CONFIG_FILE)) {
        const data = readFileSync(CONFIG_FILE, 'utf-8')
        writeFileSync(backupPath, data)
      }
    } catch {}
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: AppSettings) {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true })
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2))
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

export function registerSettingsHandlers() {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return loadSettings()
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, settings: Partial<AppSettings>) => {
    const current = loadSettings()
    const merged = { ...current, ...settings }
    saveSettings(merged)
    return merged
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_THEMES, () => {
    try {
      if (!existsSync(THEMES_DIR)) return []
      const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith('.json'))
      return files.map((f) => {
        const data = JSON.parse(readFileSync(join(THEMES_DIR, f), 'utf-8'))
        return data
      })
    } catch {
      return []
    }
  })
}
