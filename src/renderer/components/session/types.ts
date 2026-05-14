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

export interface SessionUIState {
  shellReady: boolean
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
