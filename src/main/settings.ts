import { app, ipcMain } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/ipc'
import { AppSettings } from '../shared/types'

let _configDir: string | null = null
let _configFile: string | null = null
let _themesDir: string | null = null

function getConfigDir(): string {
  if (!_configDir) _configDir = join(app.getPath('userData'))
  return _configDir
}
function getConfigFile(): string {
  if (!_configFile) _configFile = join(getConfigDir(), 'config.json')
  return _configFile
}
function getThemesDir(): string {
  if (!_themesDir) _themesDir = join(app.getAppPath(), 'themes')
  return _themesDir
}

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
    if (existsSync(getConfigFile())) {
      const data = readFileSync(getConfigFile(), 'utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
    // Backup corrupted file
    try {
      const backupPath = getConfigFile() + '.bak'
      if (existsSync(getConfigFile())) {
        const data = readFileSync(getConfigFile(), 'utf-8')
        writeFileSync(backupPath, data)
      }
    } catch {}
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: AppSettings) {
  try {
    if (!existsSync(getConfigDir())) {
      mkdirSync(getConfigDir(), { recursive: true })
    }
    writeFileSync(getConfigFile(), JSON.stringify(settings, null, 2))
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
      if (!existsSync(getThemesDir())) return []
      const files = readdirSync(getThemesDir()).filter((f) => f.endsWith('.json'))
      return files.map((f) => {
        const data = JSON.parse(readFileSync(join(getThemesDir(), f), 'utf-8'))
        return data
      })
    } catch {
      return []
    }
  })
}
