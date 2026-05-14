import type { SftpListEntry } from '@shared/types'

export interface TransferItem {
  id: number
  kind: 'upload' | 'download'
  path: string
  bytes: number
  total: number
  done: boolean
  error?: string
}

/** Remote SSH session shell lifecycle (Phase 1 — reconnect after stream closes). */
export type SessionShellPhase = 'starting' | 'connected' | 'exited'

export interface SessionUIState {
  /** PTY over SSH: `starting` until `sshShellStart` resolves; `exited` after shell stream closes (SFTP may still work). */
  shellPhase: SessionShellPhase
  cwd: string
  entries: SftpListEntry[]
  loadingDir: boolean
  editor: { path: string; text: string } | null
  transfers: TransferItem[]
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  entry: SftpListEntry | null
}

export interface PropertiesModalState {
  entry: SftpListEntry | null
  detail: SftpListEntry | null
}
