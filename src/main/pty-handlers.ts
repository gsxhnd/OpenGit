/**
 * Local PTY — node-pty in main, stream to renderer for xterm.js
 */
import { ipcMain, WebContents } from 'electron'
import * as pty from 'node-pty'
import { randomUUID } from 'crypto'
import { IPC_CHANNELS } from '../shared/ipc'

type PtySession = {
  proc: pty.IPty
  wcId: number
}

const sessions = new Map<string, PtySession>()
const wcToSessionIds = new Map<number, Set<string>>()
const ptyDestroyHooked = new Set<number>()

function trackSession(wcId: number, sessionId: string) {
  let set = wcToSessionIds.get(wcId)
  if (!set) {
    set = new Set()
    wcToSessionIds.set(wcId, set)
  }
  set.add(sessionId)
}

function cleanupWebContents(wc: WebContents) {
  const set = wcToSessionIds.get(wc.id)
  if (!set) return
  for (const sid of set) {
    const s = sessions.get(sid)
    if (s) {
      try {
        s.proc.kill()
      } catch {
        /* ignore */
      }
      sessions.delete(sid)
    }
  }
  wcToSessionIds.delete(wc.id)
}

export function registerPtyHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.PTY_LOCAL_CREATE,
    (event, opts?: { cwd?: string; cols?: number; rows?: number }) => {
      const wc = event.sender
      const sessionId = randomUUID()
      const cwd = opts?.cwd ?? process.env.HOME ?? process.env.USERPROFILE ?? process.cwd()
      const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash'
      const proc = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: Math.max(2, opts?.cols ?? 80),
        rows: Math.max(2, opts?.rows ?? 24),
        cwd,
        env: process.env as { [key: string]: string },
      })
      sessions.set(sessionId, { proc, wcId: wc.id })
      trackSession(wc.id, sessionId)

      if (!ptyDestroyHooked.has(wc.id)) {
        ptyDestroyHooked.add(wc.id)
        wc.once('destroyed', () => {
          cleanupWebContents(wc)
          ptyDestroyHooked.delete(wc.id)
        })
      }

      proc.onData((data) => {
        if (wc.isDestroyed()) return
        wc.send(IPC_CHANNELS.PTY_LOCAL_DATA, { sessionId, data: Buffer.from(data, 'utf8') })
      })
      proc.onExit(() => {
        sessions.delete(sessionId)
        const set = wcToSessionIds.get(wc.id)
        set?.delete(sessionId)
        if (!wc.isDestroyed()) {
          wc.send(IPC_CHANNELS.PTY_LOCAL_EXIT, { sessionId })
        }
      })

      return { sessionId }
    },
  )

  ipcMain.handle(IPC_CHANNELS.PTY_LOCAL_WRITE, (_event, sessionId: string, data: string | Uint8Array) => {
    const s = sessions.get(sessionId)
    if (!s) return
    const payload = typeof data === 'string' ? data : Buffer.from(data).toString('utf8')
    s.proc.write(payload)
  })

  ipcMain.handle(IPC_CHANNELS.PTY_LOCAL_RESIZE, (_event, sessionId: string, cols: number, rows: number) => {
    const s = sessions.get(sessionId)
    if (!s) return
    try {
      s.proc.resize(Math.max(2, cols), Math.max(2, rows))
    } catch {
      /* ignore */
    }
  })

  ipcMain.handle(IPC_CHANNELS.PTY_LOCAL_KILL, (_event, sessionId: string) => {
    const s = sessions.get(sessionId)
    if (!s) return
    try {
      s.proc.kill()
    } catch {
      /* ignore */
    }
    sessions.delete(sessionId)
    const set = wcToSessionIds.get(s.wcId)
    set?.delete(sessionId)
  })
}
