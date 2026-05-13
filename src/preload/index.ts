/**
 * Preload — contextBridge IPC API for renderer
 */
import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type { AppSettings, HostProfile, KnownHostEntry, SshConnectPayload, SshConnectResult } from '../shared/types'

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, partial),
  getThemes: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_THEMES),

  hostsAdd: (host: Omit<HostProfile, 'id'>): Promise<HostProfile> =>
    ipcRenderer.invoke(IPC_CHANNELS.HOSTS_ADD, host),
  hostsUpdate: (id: string, updates: Partial<HostProfile>): Promise<HostProfile[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.HOSTS_UPDATE, id, updates),
  hostsRemove: (id: string): Promise<HostProfile[]> => ipcRenderer.invoke(IPC_CHANNELS.HOSTS_REMOVE, id),

  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
  onMaximizedChange: (cb: (maximized: boolean) => void) => {
    const fn = (_: Electron.IpcRendererEvent, maximized: boolean) => cb(maximized)
    ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, fn)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, fn) }
  },
  platform: process.platform,

  openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),
  openFile: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE),
  saveFile: (suggestedName?: string) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, suggestedName),

  ptyLocalCreate: (opts?: { cwd?: string; cols?: number; rows?: number }) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_CREATE, opts),
  ptyLocalWrite: (sessionId: string, data: string | Uint8Array) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_WRITE, sessionId, data),
  ptyLocalResize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_RESIZE, sessionId, cols, rows),
  ptyLocalKill: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_KILL, sessionId),
  onPtyLocalData: (cb: (payload: { sessionId: string; data: Uint8Array }) => void) => {
    const fn = (_: Electron.IpcRendererEvent, payload: { sessionId: string; data: Uint8Array }) => cb(payload)
    ipcRenderer.on(IPC_CHANNELS.PTY_LOCAL_DATA, fn)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.PTY_LOCAL_DATA, fn) }
  },
  onPtyLocalExit: (cb: (payload: { sessionId: string }) => void) => {
    const fn = (_: Electron.IpcRendererEvent, payload: { sessionId: string }) => cb(payload)
    ipcRenderer.on(IPC_CHANNELS.PTY_LOCAL_EXIT, fn)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.PTY_LOCAL_EXIT, fn) }
  },

  sshConnect: (payload: SshConnectPayload): Promise<SshConnectResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_CONNECT, payload),
  sshDisconnect: (connectionId: string) => ipcRenderer.invoke(IPC_CHANNELS.SSH_DISCONNECT, connectionId),
  sshShellStart: (connectionId: string) => ipcRenderer.invoke(IPC_CHANNELS.SSH_SHELL_START, connectionId),
  sshShellWrite: (connectionId: string, data: string | Uint8Array) =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_SHELL_WRITE, connectionId, data),
  sshShellResize: (connectionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_SHELL_RESIZE, connectionId, cols, rows),
  onSshData: (cb: (payload: { connectionId: string; data: Uint8Array }) => void) => {
    const fn = (_: Electron.IpcRendererEvent, payload: { connectionId: string; data: Uint8Array }) => cb(payload)
    ipcRenderer.on(IPC_CHANNELS.SSH_DATA, fn)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.SSH_DATA, fn) }
  },
  onSshShellExit: (cb: (payload: { connectionId: string }) => void) => {
    const fn = (_: Electron.IpcRendererEvent, payload: { connectionId: string }) => cb(payload)
    ipcRenderer.on(IPC_CHANNELS.SSH_SHELL_EXIT, fn)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.SSH_SHELL_EXIT, fn) }
  },

  knownHostsList: (): Promise<KnownHostEntry[]> => ipcRenderer.invoke(IPC_CHANNELS.KNOWN_HOSTS_LIST),
  knownHostsRemove: (host: string, port: number): Promise<KnownHostEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.KNOWN_HOSTS_REMOVE, host, port),
  knownHostsClear: (): Promise<KnownHostEntry[]> => ipcRenderer.invoke(IPC_CHANNELS.KNOWN_HOSTS_CLEAR),

  sftpReaddir: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_READDIR, connectionId, remotePath),
  sftpReadFileText: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_READ_FILE_TEXT, connectionId, remotePath),
  sftpWriteFileText: (connectionId: string, remotePath: string, content: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_WRITE_FILE_TEXT, connectionId, remotePath, content),
  sftpMkdir: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_MKDIR, connectionId, remotePath),
  sftpRmdir: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_RMDIR, connectionId, remotePath),
  sftpRename: (connectionId: string, oldPath: string, newPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_RENAME, connectionId, oldPath, newPath),
  sftpStat: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_STAT, connectionId, remotePath),
  sftpUnlink: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_UNLINK, connectionId, remotePath),
  sftpUploadFromLocal: (connectionId: string, remotePath: string, localPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_UPLOAD_FROM_LOCAL, connectionId, remotePath, localPath),
  sftpDownloadToLocal: (connectionId: string, remotePath: string, localPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_DOWNLOAD_TO_LOCAL, connectionId, remotePath, localPath),
  sftpExists: (connectionId: string, remotePath: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_EXISTS, connectionId, remotePath),
  onSftpTransferProgress: (
    cb: (payload: {
      connectionId: string
      remotePath: string
      kind: 'upload' | 'download'
      bytes: number
      total: number
      done: boolean
      error?: string
    }) => void,
  ) => {
    const fn = (
      _: Electron.IpcRendererEvent,
      payload: {
        connectionId: string
        remotePath: string
        kind: 'upload' | 'download'
        bytes: number
        total: number
        done: boolean
        error?: string
      },
    ) => cb(payload)
    ipcRenderer.on(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, fn)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, fn) }
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
