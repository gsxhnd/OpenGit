import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { TerminalPanel } from '../components/terminal/TerminalPanel'
import { RemoteMonacoEditor } from '../components/RemoteMonacoEditor'
import type { SftpListEntry } from '@shared/types'
import { joinRemote } from '../lib/sftp/path'
import { formatSize } from '../lib/sftp/format'
import { SessionHeader } from '../components/session/SessionHeader'
import { SftpPane } from '../components/session/SftpPane'
import { SessionContextMenu } from '../components/session/SessionContextMenu'
import { NewFolderDialog } from '../components/session/NewFolderDialog'
import { PropertiesDialog } from '../components/session/PropertiesDialog'
import type { ContextMenuState, PropertiesModalState, SessionUIState } from '../components/session/types'
import styles from './SessionView.module.scss'

let transferIdCounter = 0

export function SessionView() {
  const { t } = useTranslation()
  const { connectionId } = useParams<{ connectionId: string }>()
  const navigate = useNavigate()
  const {
    sessions,
    activeSessionId,
    removeSession,
    setActiveSessionId,
    settings,
    addToast,
  } = useAppStore()

  const cid = connectionId || ''
  const meta = sessions.find((s) => s.connectionId === cid)
  const term = settings?.terminal
  const ed = settings?.editor

  const stateMapRef = useRef<Map<string, SessionUIState>>(new Map())
  function getState(): SessionUIState {
    let s = stateMapRef.current.get(cid)
    if (!s) {
      s = { shellReady: false, cwd: '/', entries: [], loadingDir: false, editor: null, transfers: [] }
      stateMapRef.current.set(cid, s)
    }
    return s
  }

  const [, rerender] = useReducer((n: number) => n + 1, 0)

  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, entry: null })
  const [propsModal, setPropsModal] = useState<PropertiesModalState>({ entry: null, detail: null })
  const [newFolderPrompt, setNewFolderPrompt] = useState(false)
  const [newFolderValue, setNewFolderValue] = useState('')

  const refreshDir = useCallback(async () => {
    if (!cid) return
    const s = getState()
    s.loadingDir = true
    rerender()
    try {
      const list = await window.api.sftpReaddir(cid, s.cwd)
      s.entries = list
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('session.sftpListFailed'), 'error')
    } finally {
      s.loadingDir = false
      rerender()
    }
  }, [cid, addToast, t])

  // Launch shell on mount
  useEffect(() => {
    if (!cid || !meta) {
      addToast(t('session.invalidSession'), 'error')
      navigate('/')
      return
    }
    if (activeSessionId !== cid) {
      setActiveSessionId(cid)
    }
    const s = getState()
    let cancelled = false
    ;(async () => {
      try {
        await window.api.sshShellStart(cid)
        if (!cancelled) {
          s.shellReady = true
          rerender()
        }
      } catch (e: unknown) {
        addToast(e instanceof Error ? e.message : t('session.shellFailed'), 'error')
        if (!cancelled) navigate('/')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cid])

  useEffect(() => {
    if (meta) void refreshDir()
  }, [refreshDir, meta])

  useEffect(() => {
    return () => {
      if (cid) {
        void window.api.sshDisconnect(cid)
        removeSession(cid)
        stateMapRef.current.delete(cid)
      }
    }
  }, [cid])

  // Transfer progress listener
  useEffect(() => {
    return window.api.onSftpTransferProgress((payload) => {
      const s = stateMapRef.current.get(payload.connectionId)
      if (!s) return
      const existing = s.transfers.find((t) => t.path === payload.remotePath && !t.done)
      if (existing) {
        existing.bytes = payload.bytes
        existing.total = payload.total
        existing.done = payload.done
        if (payload.done && payload.error) {
          existing.error = payload.error
        }
      } else {
        s.transfers.push({
          id: ++transferIdCounter,
          kind: payload.kind,
          path: payload.remotePath,
          bytes: payload.bytes,
          total: payload.total,
          done: payload.done,
          error: payload.error ?? undefined,
        })
      }
      if (payload.done && payload.error) {
        addToast(payload.error, 'error')
      }
      // Clean done transfers after 5s
      if (payload.done) {
        const tId = s.transfers.find((t) => t.path === payload.remotePath && t.done)?.id
        if (tId) {
          setTimeout(() => {
            const s2 = stateMapRef.current.get(cid)
            if (s2) {
              s2.transfers = s2.transfers.filter((t) => t.id !== tId)
              rerender()
            }
          }, 5000)
        }
      }
      rerender()
    })
  }, [])

  const disconnect = async () => {
    await window.api.sshDisconnect(cid)
    removeSession(cid)
    stateMapRef.current.delete(cid)
    if (sessions.length <= 1) {
      navigate('/')
    }
  }

  const openFile = async (remotePath: string) => {
    try {
      // Check file size first
      let stat: SftpListEntry | null = null
      try {
        stat = await window.api.sftpStat(cid, remotePath)
      } catch {
        // proceed anyway
      }
      const WARN_SIZE = 1024 * 1024 // 1MB
      if (stat && stat.size > WARN_SIZE) {
        const ok = window.confirm(
          `File is ${formatSize(stat.size)}. Open in editor? Large files may be slow.`,
        )
        if (!ok) return
      }

      const text = await window.api.sftpReadFileText(cid, remotePath)
      const s = getState()
      s.editor = { path: remotePath, text }
      rerender()
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('editor.openFileFailed'), 'error')
    }
  }

  const navigateTo = (target: string) => {
    const s = getState()
    s.cwd = target
    s.editor = null
    rerender()
  }

  // Context menu
  const closeContextMenu = () => {
    setCtxMenu({ visible: false, x: 0, y: 0, entry: null })
  }

  const handleEntryContextMenu = (e: React.MouseEvent, entry: SftpListEntry) => {
    e.preventDefault()
    setCtxMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      entry,
    })
  }

  const handleListContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      entry: null,
    })
  }

  const handleNewFolder = () => {
    closeContextMenu()
    setNewFolderValue('')
    setNewFolderPrompt(true)
  }

  const submitNewFolder = async () => {
    const name = newFolderValue.trim()
    if (!name) return
    const s = getState()
    const path = joinRemote(s.cwd, name)
    try {
      await window.api.sftpMkdir(cid, path)
      addToast(t('session.folderCreated'), 'success')
      setNewFolderPrompt(false)
      await refreshDir()
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('session.mkdirFailed'), 'error')
    }
  }

  const handleRename = () => {
    const entry = ctxMenu.entry
    if (!entry) return
    closeContextMenu()
    const s = getState()
    const oldPath = joinRemote(s.cwd, entry.name)
    const newName = window.prompt(t('session.enterNewName', { name: entry.name }), entry.name)
    if (!newName || newName.trim() === entry.name) return
    const newPath = joinRemote(s.cwd, newName.trim())
    ;(async () => {
      try {
        await window.api.sftpRename(cid, oldPath, newPath)
        addToast(t('session.renamed'), 'success')
        await refreshDir()
      } catch (e: unknown) {
        addToast(e instanceof Error ? e.message : t('session.renameFailed'), 'error')
      }
    })()
  }

  const handleDelete = () => {
    const entry = ctxMenu.entry
    if (!entry) return
    closeContextMenu()
    const confirmed = window.confirm(t('session.confirmDelete', { name: entry.name }))
    if (!confirmed) return
    const s = getState()
    const path = joinRemote(s.cwd, entry.name)
    ;(async () => {
      try {
        if (entry.isDirectory) {
          await window.api.sftpRmdir(cid, path)
        } else {
          await window.api.sftpUnlink(cid, path)
        }
        addToast(t('session.deleted'), 'success')
        await refreshDir()
      } catch (e: unknown) {
        addToast(e instanceof Error ? e.message : t('session.deleteFailed'), 'error')
      }
    })()
  }

  const handleProperties = async () => {
    const entry = ctxMenu.entry
    if (!entry) return
    closeContextMenu()
    const s = getState()
    const path = joinRemote(s.cwd, entry.name)
    try {
      const detail = await window.api.sftpStat(cid, path)
      setPropsModal({ entry, detail })
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Stat failed', 'error')
    }
  }

  // Upload / Download
  const handleUpload = async () => {
    const local = await window.api.openFile()
    if (!local) return
    const s = getState()
    const base = local.split(/[/\\]/).pop() || 'upload.bin'
    const remotePath = joinRemote(s.cwd, base)
    try {
      const exists = await window.api.sftpExists(cid, remotePath)
      if (exists) {
        const ok = window.confirm(
          t('session.overwriteConfirm', { name: base }),
        )
        if (!ok) return
      }
      await window.api.sftpUploadFromLocal(cid, remotePath, local)
      addToast(t('session.uploaded'), 'success')
      await refreshDir()
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('session.uploadFailed'), 'error')
    }
  }

  const handleDownload = async (entry: SftpListEntry) => {
    if (entry.isDirectory) return
    const s = getState()
    const remotePath = joinRemote(s.cwd, entry.name)
    const local = await window.api.saveFile(entry.name)
    if (!local) return
    try {
      await window.api.sftpDownloadToLocal(cid, remotePath, local)
      addToast(t('session.downloaded'), 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('session.downloadFailed'), 'error')
    }
  }

  // Close menus on click outside
  useEffect(() => {
    if (!ctxMenu.visible) return
    const handler = () => closeContextMenu()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [ctxMenu.visible])

  if (!meta) {
    return null
  }

  const st = getState()
  const activeTransfers = st.transfers.filter((tr) => !tr.done)

  return (
    <div className={styles.root}>
      <SessionHeader
        meta={meta}
        fingerprint={meta.fingerprint}
        disconnectLabel={t('session.disconnect')}
        onDisconnect={() => void disconnect()}
      />

      <div className={styles.body}>
        <SftpPane
          connectionId={cid}
          cwd={st.cwd}
          entries={st.entries}
          transfers={activeTransfers}
          labels={{ parent: t('session.parent'), newFolder: t('session.newFolder'), upload: t('session.upload') }}
          onNavigate={navigateTo}
          onOpenFile={(path) => { void openFile(path) }}
          onEntryContextMenu={handleEntryContextMenu}
          onListContextMenu={handleListContextMenu}
          onNewFolder={handleNewFolder}
          onUpload={() => { void handleUpload() }}
        />

        <SessionContextMenu
          state={ctxMenu}
          labels={{
            newFolder: t('session.newFolder'),
            download: t('session.downloaded'),
            rename: t('session.rename'),
            delete: t('session.delete'),
            properties: t('session.properties'),
          }}
          onNewFolder={handleNewFolder}
          onDownload={(entry) => {
            closeContextMenu()
            void handleDownload(entry)
          }}
          onRename={handleRename}
          onDelete={handleDelete}
          onProperties={handleProperties}
        />

        <div className={styles.mainCol}>
          <div className={styles.termArea}>
            {st.shellReady ? (
              <TerminalPanel
                mode={{ kind: 'ssh', connectionId: cid }}
                title={meta.hostLabel || `${meta.username}@${meta.host}`}
                protocol="SSH"
                status="connected"
                settings={term}
                session={meta}
                onExit={() => addToast(t('session.shellClosed'), 'info')}
              />
            ) : (
              <div className={styles.muted}>{t('session.startingShell')}</div>
            )}
          </div>
          {st.editor && ed && (
            <div className={styles.editorArea}>
              <RemoteMonacoEditor
                key={st.editor.path}
                connectionId={cid}
                remotePath={st.editor.path}
                initialText={st.editor.text}
                fontSize={ed.fontSize}
                tabSize={ed.tabSize}
                wordWrap={ed.wordWrap}
                minimap={ed.minimap}
                onClose={() => {
                  st.editor = null
                  rerender()
                }}
                onSaved={() => void refreshDir()}
                addToast={addToast}
              />
            </div>
          )}
        </div>
      </div>

      {newFolderPrompt ? (
        <NewFolderDialog
          value={newFolderValue}
          labels={{ title: t('session.newFolder'), placeholder: t('session.enterFolderName'), cancel: t('ui.cancel'), add: t('ui.add') }}
          onChange={setNewFolderValue}
          onCancel={() => setNewFolderPrompt(false)}
          onSubmit={() => { void submitNewFolder() }}
        />
      ) : null}

      {propsModal.detail ? (
        <PropertiesDialog
          detail={propsModal.detail}
          labels={{ title: t('session.properties'), close: t('ui.close') }}
          onClose={() => setPropsModal({ entry: null, detail: null })}
        />
      ) : null}
    </div>
  )
}
