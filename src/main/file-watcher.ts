import { BrowserWindow } from 'electron'
import { watch, FSWatcher } from 'fs'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/ipc'

let watcher: FSWatcher | null = null
let debounceTimer: NodeJS.Timeout | null = null
const DEBOUNCE_MS = 500

export function setupFileWatcher(repoPath: string, win: BrowserWindow) {
  stopFileWatcher()

  try {
    watcher = watch(repoPath, { recursive: true }, (eventType, filename) => {
      // Ignore .git internal changes (except HEAD, refs which indicate branch/commit changes)
      if (filename) {
        const normalized = filename.replace(/\\/g, '/')
        if (
          normalized.startsWith('.git/') &&
          !normalized.startsWith('.git/HEAD') &&
          !normalized.startsWith('.git/refs/')
        ) {
          return
        }
      }

      // Debounce
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.REPO_CHANGED)
        }
      }, DEBOUNCE_MS)
    })
  } catch (err) {
    console.error('Failed to setup file watcher:', err)
  }
}

export function stopFileWatcher() {
  if (watcher) {
    watcher.close()
    watcher = null
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}
