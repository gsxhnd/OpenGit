/**
 * SSH shell + SFTP — ssh2 in main process, stream shell bytes to renderer.
 */
import { ipcMain, WebContents } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'
import { Client, ConnectConfig, SFTPWrapper, ClientChannel } from 'ssh2'
import { IPC_CHANNELS } from '../shared/ipc'
import type { SftpListEntry, SshConnectPayload, SshConnectResult } from '../shared/types'
import { findKnownHost, addKnownHost } from './settings'

const MAX_REMOTE_TEXT_BYTES = 50 * 1024 * 1024

type Conn = {
  client: Client
  wcId: number
  shellStream: ClientChannel | null
  sftp: SFTPWrapper | null
  sftpPromise: Promise<SFTPWrapper> | null
}

const connections = new Map<string, Conn>()
const wcToConnIds = new Map<number, Set<string>>()
const sshDestroyHooked = new Set<number>()

function trackConn(wcId: number, id: string) {
  let set = wcToConnIds.get(wcId)
  if (!set) {
    set = new Set()
    wcToConnIds.set(wcId, set)
  }
  set.add(id)
}

function cleanupWebContents(wc: WebContents) {
  const set = wcToConnIds.get(wc.id)
  if (!set) return
  for (const id of set) {
    const c = connections.get(id)
    if (c) {
      try {
        c.shellStream?.destroy()
        c.client.end()
      } catch {
        /* ignore */
      }
      connections.delete(id)
    }
  }
  wcToConnIds.delete(wc.id)
}

function loadPrivateKey(path: string): Buffer | undefined {
  if (!path || !existsSync(path)) return undefined
  return readFileSync(path)
}

export function registerSshSftpHandlers() {
  ipcMain.handle(IPC_CHANNELS.SSH_CONNECT, (event, payload: SshConnectPayload): Promise<SshConnectResult> => {
    const wc = event.sender
    return new Promise((resolve, reject) => {
      const client = new Client()
      const connectionId = randomUUID()
      let fingerprint = ''
      let hostKeyAccepted = false

      const existing = findKnownHost(payload.host, payload.port)

      const config: ConnectConfig = {
        host: payload.host,
        port: payload.port || 22,
        username: payload.username,
        readyTimeout: 20000,
        tryKeyboard: true,
        hostVerifier: (hashedKey: string) => {
          fingerprint = hashedKey
          // If user explicitly provided expected fingerprint, use it
          if (payload.expectedFingerprint) {
            hostKeyAccepted = hashedKey === payload.expectedFingerprint
            return hostKeyAccepted
          }
          // If known host exists, verify matches
          if (existing) {
            hostKeyAccepted = hashedKey === existing.fingerprint
            return hostKeyAccepted
          }
          // First time connecting — accept and save later
          hostKeyAccepted = true
          return true
        },
      }
      if (payload.password) {
        config.password = payload.password
      }
      if (payload.privateKeyPath) {
        const pk = loadPrivateKey(payload.privateKeyPath)
        if (!pk) {
          reject(new Error('Private key file not found'))
          return
        }
        config.privateKey = pk
      }
      if (payload.passphrase) {
        config.passphrase = payload.passphrase
      }

      if (!config.password && !config.privateKey) {
        reject(new Error('Password or private key required'))
        return
      }

      client
        .on('ready', () => {
          connections.set(connectionId, {
            client,
            wcId: wc.id,
            shellStream: null,
            sftp: null,
            sftpPromise: null,
          })
          trackConn(wc.id, connectionId)
          if (!sshDestroyHooked.has(wc.id)) {
            sshDestroyHooked.add(wc.id)
            wc.once('destroyed', () => {
              cleanupWebContents(wc)
              sshDestroyHooked.delete(wc.id)
            })
          }
          // Save fingerprint to known_hosts if new or updated
          const isNewHost = !existing || existing.fingerprint !== fingerprint
          if (hostKeyAccepted && fingerprint) {
            addKnownHost({
              host: payload.host,
              port: payload.port || 22,
              fingerprint,
              addedAt: Date.now(),
            })
          }
          resolve({ connectionId, fingerprint, isNewHost })
        })
        .on('error', (err) => {
          reject(err)
        })
        .connect(config)
    })
  })

  ipcMain.handle(IPC_CHANNELS.SSH_DISCONNECT, (_event, connectionId: string) => {
    const c = connections.get(connectionId)
    if (!c) return
    try {
      c.shellStream?.destroy()
      c.client.end()
    } catch {
      /* ignore */
    }
    connections.delete(connectionId)
    const set = wcToConnIds.get(c.wcId)
    set?.delete(connectionId)
  })

  ipcMain.handle(IPC_CHANNELS.SSH_SHELL_START, (event, connectionId: string) => {
    const wc = event.sender
    const c = connections.get(connectionId)
    if (!c) throw new Error('Unknown connection')
    return new Promise<void>((resolve, reject) => {
      c.client.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
        if (err) {
          reject(err)
          return
        }
        c.shellStream = stream
        stream.on('data', (chunk: Buffer) => {
          if (wc.isDestroyed()) return
          wc.send(IPC_CHANNELS.SSH_DATA, { connectionId, data: chunk })
        })
        stream.stderr?.on('data', (chunk: Buffer) => {
          if (wc.isDestroyed()) return
          wc.send(IPC_CHANNELS.SSH_DATA, { connectionId, data: chunk })
        })
        stream.on('close', () => {
          c.shellStream = null
          if (!wc.isDestroyed()) {
            wc.send(IPC_CHANNELS.SSH_SHELL_EXIT, { connectionId })
          }
        })
        resolve()
      })
    })
  })

  ipcMain.handle(IPC_CHANNELS.SSH_SHELL_WRITE, (_event, connectionId: string, data: string | Uint8Array) => {
    const c = connections.get(connectionId)
    if (!c?.shellStream) return
    const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data)
    c.shellStream.write(buf)
  })

  ipcMain.handle(IPC_CHANNELS.SSH_SHELL_RESIZE, (_event, connectionId: string, cols: number, rows: number) => {
    const c = connections.get(connectionId)
    if (!c?.shellStream) return
    try {
      c.shellStream.setWindow(Math.max(2, rows), Math.max(2, cols), 0, 0)
    } catch {
      /* ignore */
    }
  })

  function getSftp(connectionId: string): Promise<SFTPWrapper> {
    const c = connections.get(connectionId)
    if (!c) return Promise.reject(new Error('Unknown connection'))
    if (c.sftp) return Promise.resolve(c.sftp)
    if (c.sftpPromise) return c.sftpPromise
    c.sftpPromise = new Promise((resolve, reject) => {
      c.client.sftp((err, sftp) => {
        if (err) {
          c.sftpPromise = null
          reject(err)
          return
        }
        c.sftp = sftp
        c.sftpPromise = null
        resolve(sftp)
      })
    })
    return c.sftpPromise
  }

  ipcMain.handle(IPC_CHANNELS.SFTP_READDIR, async (_event, connectionId: string, remotePath: string) => {
    const sftp = await getSftp(connectionId)
    return new Promise<SftpListEntry[]>((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        if (err) {
          reject(err)
          return
        }
        const out: SftpListEntry[] = (list || []).map((item) => {
          const mode = item.attrs.mode || 0
          const isDirectory = (mode & 0o40000) === 0o40000
          const mtime = item.attrs.mtime
          return {
            name: item.filename,
            longname: item.longname,
            isDirectory,
            size: item.attrs.size ?? 0,
            mtimeMs: typeof mtime === 'number' ? mtime * 1000 : null,
          }
        })
        out.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        resolve(out)
      })
    })
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_READ_FILE_TEXT, async (_event, connectionId: string, remotePath: string) => {
    const sftp = await getSftp(connectionId)
    return new Promise<string>((resolve, reject) => {
      sftp.readFile(remotePath, (err, data) => {
        if (err) {
          reject(err)
          return
        }
        if (data.length > MAX_REMOTE_TEXT_BYTES) {
          reject(new Error(`File too large (max ${MAX_REMOTE_TEXT_BYTES} bytes)`))
          return
        }
        resolve(data.toString('utf8'))
      })
    })
  })

  ipcMain.handle(
    IPC_CHANNELS.SFTP_WRITE_FILE_TEXT,
    async (_event, connectionId: string, remotePath: string, content: string) => {
      const sftp = await getSftp(connectionId)
      return new Promise<void>((resolve, reject) => {
        sftp.writeFile(remotePath, Buffer.from(content, 'utf8'), (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    },
  )

  ipcMain.handle(IPC_CHANNELS.SFTP_MKDIR, async (_event, connectionId: string, remotePath: string) => {
    const sftp = await getSftp(connectionId)
    return new Promise<void>((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_RMDIR, async (_event, connectionId: string, remotePath: string) => {
    const sftp = await getSftp(connectionId)
    return new Promise<void>((resolve, reject) => {
      sftp.rmdir(remotePath, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })

  ipcMain.handle(
    IPC_CHANNELS.SFTP_RENAME,
    async (_event, connectionId: string, oldPath: string, newPath: string) => {
      const sftp = await getSftp(connectionId)
      return new Promise<void>((resolve, reject) => {
        sftp.rename(oldPath, newPath, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    },
  )

  ipcMain.handle(IPC_CHANNELS.SFTP_STAT, async (_event, connectionId: string, remotePath: string) => {
    const sftp = await getSftp(connectionId)
    return new Promise<SftpListEntry>((resolve, reject) => {
      sftp.stat(remotePath, (err, stats) => {
        if (err) {
          reject(err)
          return
        }
        const mode = stats.mode || 0
        const isDirectory = (mode & 0o40000) === 0o40000
        const mtime = stats.mtime
        const name = remotePath.split('/').pop() || remotePath
        resolve({
          name,
          longname: `-rwxr-xr-x 1 user group ${stats.size ?? 0} Jan 01 1970 ${name}`,
          isDirectory,
          size: stats.size ?? 0,
          mtimeMs: typeof mtime === 'number' ? mtime * 1000 : null,
        })
      })
    })
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_UNLINK, async (_event, connectionId: string, remotePath: string) => {
    const sftp = await getSftp(connectionId)
    return new Promise<void>((resolve, reject) => {
      sftp.unlink(remotePath, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })

  ipcMain.handle(
    IPC_CHANNELS.SFTP_EXISTS,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId)
      return new Promise<boolean>((resolve) => {
        sftp.stat(remotePath, (err) => {
          resolve(!err)
        })
      })
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.SFTP_UPLOAD_FROM_LOCAL,
    async (event, connectionId: string, remotePath: string, localPath: string) => {
      if (!existsSync(localPath)) throw new Error('Local file not found')
      const wc = event.sender
      const buf = readFileSync(localPath)
      const total = buf.length
      wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
        connectionId,
        remotePath,
        kind: 'upload',
        bytes: 0,
        total,
        done: false,
      })
      const sftp = await getSftp(connectionId)
      return new Promise<void>((resolve, reject) => {
        sftp.writeFile(remotePath, buf, (err) => {
          if (err) {
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: 'upload',
              bytes: total,
              total,
              done: true,
              error: err.message,
            })
            reject(err)
            return
          }
          wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
            connectionId,
            remotePath,
            kind: 'upload',
            bytes: total,
            total,
            done: true,
          })
          resolve()
        })
      })
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.SFTP_DOWNLOAD_TO_LOCAL,
    async (event, connectionId: string, remotePath: string, localPath: string) => {
      const wc = event.sender
      const sftp = await getSftp(connectionId)
      return new Promise<void>((resolve, reject) => {
        sftp.readFile(remotePath, (err, data) => {
          if (err) {
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: 'download',
              bytes: 0,
              total: 0,
              done: true,
              error: err.message,
            })
            reject(err)
            return
          }
          const total = data.length
          wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
            connectionId,
            remotePath,
            kind: 'download',
            bytes: 0,
            total,
            done: false,
          })
          try {
            writeFileSync(localPath, data)
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: 'download',
              bytes: total,
              total,
              done: true,
            })
            resolve()
          } catch (e) {
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: 'download',
              bytes: 0,
              total,
              done: true,
              error: String(e),
            })
            reject(e)
          }
        })
      })
    },
  )
}
