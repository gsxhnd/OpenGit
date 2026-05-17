import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'puck.commandPalette.recents'
const MAX_RECENTS = 8

function readRecents(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeRecents(ids: string[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_RECENTS)))
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

export function useCommandRecents() {
  const recents = useSyncExternalStore(subscribe, () => recentsSnapshot, () => recentsSnapshot)

  const recordRecent = useCallback((id: string) => {
    const next = [id, ...readRecents().filter((item) => item !== id)].slice(0, MAX_RECENTS)
    writeRecents(next)
    emit()
  }, [])

  const recentRank = useCallback(
    (id: string) => {
      const index = recents.indexOf(id)
      return index === -1 ? -1 : MAX_RECENTS - index
    },
    [recents],
  )

  return { recents, recordRecent, recentRank }
}
