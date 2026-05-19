import { useCallback, useSyncExternalStore } from 'react'

export interface RecentConnection {
  id: string
  hostLabel: string
  host: string
  port: number
  username: string
  hostProfileId?: string
  connectedAt: number
}

const STORAGE_KEY = 'puck.recentConnections'
const MAX_RECENTS = 12

function connectionKey(host: string, port: number, username: string): string {
  return `${username}@${host}:${port}`
}

function readRecents(): RecentConnection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is RecentConnection =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as RecentConnection).id === 'string' &&
        typeof (item as RecentConnection).host === 'string' &&
        typeof (item as RecentConnection).connectedAt === 'number',
    )
  } catch {
    return []
  }
}

function writeRecents(entries: RecentConnection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_RECENTS)))
}

let recentsSnapshot = readRecents()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(): void {
  recentsSnapshot = readRecents()
  for (const listener of listeners) listener()
}

export type RecordRecentInput = Omit<RecentConnection, 'id' | 'connectedAt'>

export function useRecentConnections() {
  const recents = useSyncExternalStore(subscribe, () => recentsSnapshot, () => recentsSnapshot)

  const recordRecent = useCallback((input: RecordRecentInput) => {
    const id = connectionKey(input.host, input.port, input.username)
    const next: RecentConnection = {
      ...input,
      id,
      connectedAt: Date.now(),
    }
    const filtered = readRecents().filter((item) => item.id !== id)
    writeRecents([next, ...filtered])
    emit()
  }, [])

  const clearRecents = useCallback(() => {
    writeRecents([])
    emit()
  }, [])

  return { recents, recordRecent, clearRecents }
}
