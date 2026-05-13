import { app, ipcMain } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { IPC_CHANNELS } from '../shared/ipc'
import type { AppSettings, HostProfile, KnownHostEntry } from '../shared/types'

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

export const DEFAULT_SETTINGS: AppSettings = {
  window: { width: 1200, height: 760 },
  theme: 'Standard Dark',
  language: 'en',
  hosts: [],
  terminal: {
    fontSize: 14,
    scrollback: 5000,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
  },
}

export function loadSettings(): AppSettings {
  try {
    if (existsSync(getConfigFile())) {
      const data = readFileSync(getConfigFile(), 'utf-8')
      const parsed = JSON.parse(data) as Partial<AppSettings>
      return migrateSettings({ ...DEFAULT_SETTINGS, ...parsed })
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
    try {
      const backupPath = getConfigFile() + '.bak'
      if (existsSync(getConfigFile())) {
        const data = readFileSync(getConfigFile(), 'utf-8')
        writeFileSync(backupPath, data)
      }
    } catch {
      /* ignore */
    }
  }
  return { ...DEFAULT_SETTINGS }
}

/** Merge legacy OpenGit keys into Puck shape */
function migrateSettings(s: AppSettings): AppSettings {
  const any = s as unknown as Record<string, unknown>
  if (!Array.isArray(s.hosts) && Array.isArray(any.recentRepos)) {
    s.hosts = []
  }
  if (!s.terminal) s.terminal = { ...DEFAULT_SETTINGS.terminal }
  if (!s.editor) s.editor = { ...DEFAULT_SETTINGS.editor }
  return s
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

let _knownHostsFile: string | null = null

function getKnownHostsFile(): string {
  if (!_knownHostsFile) _knownHostsFile = join(getConfigDir(), 'known_hosts.json')
  return _knownHostsFile
}

export function loadKnownHosts(): KnownHostEntry[] {
  try {
    if (existsSync(getKnownHostsFile())) {
      const data = readFileSync(getKnownHostsFile(), 'utf-8')
      return JSON.parse(data) as KnownHostEntry[]
    }
  } catch {
    /* ignore corrupt file; backup before overwrite */
  }
  return []
}

function saveKnownHosts(hosts: KnownHostEntry[]) {
  try {
    if (!existsSync(getConfigDir())) {
      mkdirSync(getConfigDir(), { recursive: true })
    }
    writeFileSync(getKnownHostsFile(), JSON.stringify(hosts, null, 2))
  } catch (err) {
    console.error('Failed to save known_hosts:', err)
  }
}

export function addKnownHost(entry: KnownHostEntry) {
  const hosts = loadKnownHosts()
  // Update existing or append
  const idx = hosts.findIndex((h) => h.host === entry.host && h.port === entry.port)
  if (idx >= 0) {
    hosts[idx] = entry
  } else {
    hosts.push(entry)
  }
  saveKnownHosts(hosts)
}

export function findKnownHost(host: string, port: number): KnownHostEntry | undefined {
  return loadKnownHosts().find((h) => h.host === host && h.port === port)
}

export function registerSettingsHandlers() {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => loadSettings())

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, partial: Partial<AppSettings>) => {
    const current = loadSettings()
    const merged = { ...current, ...partial }
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

  ipcMain.handle(IPC_CHANNELS.HOSTS_ADD, (_event, host: Omit<HostProfile, 'id'>) => {
    const settings = loadSettings()
    const entry: HostProfile = { ...host, id: randomUUID() }
    settings.hosts.push(entry)
    saveSettings(settings)
    return entry
  })

  ipcMain.handle(IPC_CHANNELS.HOSTS_UPDATE, (_event, id: string, updates: Partial<HostProfile>) => {
    const settings = loadSettings()
    const i = settings.hosts.findIndex((h) => h.id === id)
    if (i >= 0) {
      settings.hosts[i] = { ...settings.hosts[i], ...updates }
      saveSettings(settings)
    }
    return loadSettings().hosts
  })

  ipcMain.handle(IPC_CHANNELS.HOSTS_REMOVE, (_event, id: string) => {
    const settings = loadSettings()
    settings.hosts = settings.hosts.filter((h) => h.id !== id)
    saveSettings(settings)
    return settings.hosts
  })

  ipcMain.handle(IPC_CHANNELS.KNOWN_HOSTS_LIST, () => loadKnownHosts())

  ipcMain.handle(IPC_CHANNELS.KNOWN_HOSTS_REMOVE, (_event, host: string, port: number) => {
    const hosts = loadKnownHosts().filter((h) => !(h.host === host && h.port === port))
    saveKnownHosts(hosts)
    return hosts
  })

  ipcMain.handle(IPC_CHANNELS.KNOWN_HOSTS_CLEAR, () => {
    saveKnownHosts([])
    return []
  })
}
