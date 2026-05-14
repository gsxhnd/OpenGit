/**
 * Shared types — main, preload, renderer
 */

export interface WindowConfig {
  width: number
  height: number
  x?: number
  y?: number
}

/** Saved SSH host bookmark */
export interface HostProfile {
  id: string
  label: string
  host: string
  port: number
  username: string
  /** If set, host key must match (from ssh:connect result) */
  trustedFingerprint?: string
  authType: 'password' | 'privateKey'
  /** Stored only if user chooses to save password (local config) */
  password?: string
  privateKeyPath?: string
  passphrase?: string
}

export interface TerminalSettings {
  fontSize: number
  scrollback: number
  fontFamily: string
  cursorStyle: 'block' | 'underline' | 'bar'
  windowsShell: 'powershell' | 'cmd' | 'wsl'
}

export interface EditorSettings {
  fontSize: number
  tabSize: number
  wordWrap: 'on' | 'off'
  minimap: boolean
}

export interface AppSettings {
  window: WindowConfig
  theme: string
  language: string
  hosts: HostProfile[]
  terminal: TerminalSettings
  editor: EditorSettings
}

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  kind: ToastKind
  createdAt: number
}

/** App navigation views */
export type ViewType = 'dashboard' | 'connections' | 'local-terminal' | 'session' | 'files' | 'settings'

/** Active remote session (after connect) */
export interface RemoteSessionMeta {
  connectionId: string
  hostLabel: string
  username: string
  host: string
  port: number
  /** Server host key fingerprint from last connect */
  fingerprint?: string
}

export interface SftpListEntry {
  name: string
  longname: string
  isDirectory: boolean
  size: number
  mtimeMs: number | null
}

/** Known host entry (fingerprint store) */
export interface KnownHostEntry {
  host: string
  port: number
  fingerprint: string
  addedAt: number
}

/** One-time connect payload (password may be omitted if saved on host) */
export interface SshConnectPayload {
  host: string
  port: number
  username: string
  password?: string
  privateKeyPath?: string
  passphrase?: string
  expectedFingerprint?: string
}

export interface SshConnectResult {
  connectionId: string
  fingerprint: string
  /** true when this is the first connection to this host (fingerprint newly saved) */
  isNewHost: boolean
}
