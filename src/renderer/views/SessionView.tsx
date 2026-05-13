import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { XtermPane } from '../components/XtermPane'
import { RemoteMonacoEditor } from '../components/RemoteMonacoEditor'
import { SftpTreeView } from '../components/SftpTreeView'
import type { SftpListEntry } from '@shared/types'
import { ArrowUp, Upload, Download, Plus, X, FolderPlus, Trash2, Pencil, Info } from 'lucide-react'
import styles from './SessionView.module.scss'

function joinRemote(parent: string, name: string): string {
  if (parent === '/') return `/${name}`
  return `${parent.replace(/\/$/, '')}/${name}`
}

function parentPath(p: string): string {
  if (p === '/' || p === '') return '/'
  const trimmed = p.replace(/\/$/, '')
  const i = trimmed.lastIndexOf('/')
  if (i <= 0) return '/'
  return trimmed.slice(0, i) || '/'
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}K`
  return `${bytes}B`
}

function formatPerms(entry: SftpListEntry): string {
  if (entry.longname) {
    const match = entry.longname.match(/^([d\-][rwx\-]{9}|[d\-][rwx\-]{9}[+@])/)
    if (match) return match[1]
  }
  return entry.isDirectory ? 'd---------' : '----------'
}

interface TransferItem {
  id: number
  kind: 'upload' | 'download'
  path: string
  bytes: number
  total: number
  done: boolean
  error?: string
}

let transferIdCounter = 0

/** Per-session UI state */
interface SessionUIState {
  shellReady: boolean
  cwd: string
  entries: SftpListEntry[]
  loadingDir: boolean
  editor: { path: string; text: string } | null
  transfers: TransferItem[]
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  entry: SftpListEntry | null
}

interface PropertiesModal {
  entry: SftpListEntry | null
  detail: SftpListEntry | null
}

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
  const [propsModal, setPropsModal] = useState<PropertiesModal>({ entry: null, detail: null })
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

  const switchTo = (targetCid: string) => {
    setActiveSessionId(targetCid)
    navigate(`/session/${targetCid}`)
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
      {/* Session tabs */}
      <header className={styles.tabs}>
        <div className={styles.tabList}>
          {sessions.map((ses) => (
            <button
              key={ses.connectionId}
              type="button"
              className={`${styles.tab} ${ses.connectionId === cid ? styles.tabActive : ''}`}
              onClick={() => switchTo(ses.connectionId)}
            >
              <span className={styles.tabLabel}>
                {ses.hostLabel || `${ses.username}@${ses.host}`}
              </span>
              {ses.connectionId === cid && (
                <span
                  className={styles.tabClose}
                  onClick={(e) => {
                    e.stopPropagation()
                    void disconnect()
                  }}
                >
                  <X size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className={styles.newTabBtn}
          onClick={() => navigate('/')}
          title={t('session.newSession')}
        >
          <Plus size={14} />
        </Button>
      </header>

      {/* Session body */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <span className={styles.badge}>SSH</span>
          <span className={styles.sessionTitle}>
            {meta.username}@{meta.host}:{meta.port}
          </span>
          {meta.fingerprint && (
            <span className={styles.fingerprint}>{meta.fingerprint.slice(0, 16)}</span>
          )}
        </div>
        <div className={styles.headerActions}>
          <Button size="sm" variant="destructive" onClick={() => void disconnect()}>
            {t('session.disconnect')}
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <aside className={styles.sftp}>
          <div className={styles.sftpToolbar}>
            <Button size="sm" variant="ghost" title={t('session.parent')} onClick={() => navigateTo(parentPath(st.cwd))}>
              <ArrowUp size={16} />
            </Button>
            <Button size="sm" variant="ghost" title={t('session.newFolder')} onClick={handleNewFolder}>
              <FolderPlus size={14} />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void handleUpload()}>
              <Upload size={14} className="mr-1" />
              {t('session.upload')}
            </Button>
          </div>
          <div className={styles.breadcrumb}>
            {(() => {
              const parts = st.cwd.split('/').filter(Boolean)
              return (
                <>
                  <button type="button" className={styles.breadcrumbItem} onClick={() => navigateTo('/')}>
                    /
                  </button>
                  {parts.map((part, i) => {
                    const path = '/' + parts.slice(0, i + 1).join('/')
                    return (
                      <span key={path}>
                        <span className={styles.breadcrumbSep}>/</span>
                        <button type="button" className={styles.breadcrumbItem} onClick={() => navigateTo(path)}>
                          {part}
                        </button>
                      </span>
                    )
                  })}
                </>
              )
            })()}
          </div>

          {/* Transfer queue */}
          {activeTransfers.length > 0 && (
            <div className={styles.transferQueue}>
              {activeTransfers.map((tr) => (
                <div key={tr.id} className={styles.transferBar}>
                  <div className={styles.transferInfo}>
                    <span className={styles.transferArrow}>{tr.kind === 'upload' ? '↑' : '↓'}</span>
                    <span className={styles.transferName}>{tr.path.split('/').pop()}</span>
                    <span className={styles.transferSize}>
                      {formatSize(tr.bytes)}{tr.total > 0 && ` / ${formatSize(tr.total)}`}
                    </span>
                  </div>
                  <div className={styles.transferProgress}>
                    <div
                      className={styles.transferFill}
                      style={{ width: tr.total > 0 ? `${Math.round((tr.bytes / tr.total) * 100)}%` : '100%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <SftpTreeView
            connectionId={cid}
            cwd={st.cwd}
            entries={st.entries}
            onNavigate={(path) => navigateTo(path)}
            onOpenFile={(path) => { void openFile(path) }}
            onContextMenu={(e, entry) => handleEntryContextMenu(e, entry)}
            onListContextMenu={handleListContextMenu}
          />
        </aside>

        {/* Context menu */}
        {ctxMenu.visible && (
          <div className={styles.contextMenu} style={{ left: ctxMenu.x, top: ctxMenu.y }}>
            <button type="button" className={styles.contextMenuItem} onClick={handleNewFolder}>
              <FolderPlus size={14} />
              <span>{t('session.newFolder')}</span>
            </button>
            {ctxMenu.entry && (
              <>
                {!ctxMenu.entry.isDirectory && (
                  <button type="button" className={styles.contextMenuItem} onClick={() => {
                    const e = ctxMenu.entry
                    closeContextMenu()
                    if (e) void handleDownload(e)
                  }}>
                    <Download size={14} />
                    <span>{t('session.downloaded')}</span>
                  </button>
                )}
                <button type="button" className={styles.contextMenuItem} onClick={handleRename}>
                  <Pencil size={14} />
                  <span>{t('session.rename')}</span>
                </button>
                <button type="button" className={styles.contextMenuItem} onClick={handleDelete}>
                  <Trash2 size={14} />
                  <span>{t('session.delete')}</span>
                </button>
                <button type="button" className={styles.contextMenuItem} onClick={handleProperties}>
                  <Info size={14} />
                  <span>{t('session.properties')}</span>
                </button>
              </>
            )}
          </div>
        )}

        <div className={styles.mainCol}>
          <div className={styles.termArea}>
            {st.shellReady ? (
              <XtermPane
                mode={{ kind: 'ssh', connectionId: cid }}
                fontSize={term?.fontSize ?? 14}
                fontFamily={term?.fontFamily ?? 'Menlo, Monaco, monospace'}
                scrollback={term?.scrollback ?? 5000}
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

      {/* New folder dialog */}
      {newFolderPrompt && (
        <div className={styles.modalOverlay} onClick={() => setNewFolderPrompt(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('session.newFolder')}</h3>
            <input
              className={styles.modalInput}
              value={newFolderValue}
              onChange={(e) => setNewFolderValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitNewFolder()
                if (e.key === 'Escape') setNewFolderPrompt(false)
              }}
              placeholder={t('session.enterFolderName')}
              autoFocus
            />
            <div className={styles.modalActions}>
              <Button size="sm" variant="ghost" onClick={() => setNewFolderPrompt(false)}>
                {t('ui.cancel')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void submitNewFolder()}>
                {t('ui.add')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Properties modal */}
      {propsModal.detail && (
        <div className={styles.modalOverlay} onClick={() => setPropsModal({ entry: null, detail: null })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('session.properties')}</h3>
            <div className={styles.propsTable}>
              <div className={styles.propsRow}>
                <span className={styles.propsLabel}>Name</span>
                <span className={styles.propsValue}>{propsModal.detail.name}</span>
              </div>
              <div className={styles.propsRow}>
                <span className={styles.propsLabel}>Type</span>
                <span className={styles.propsValue}>{propsModal.detail.isDirectory ? 'Directory' : 'File'}</span>
              </div>
              <div className={styles.propsRow}>
                <span className={styles.propsLabel}>Size</span>
                <span className={styles.propsValue}>{formatSize(propsModal.detail.size)}</span>
              </div>
              <div className={styles.propsRow}>
                <span className={styles.propsLabel}>Permissions</span>
                <span className={styles.propsValueMono}>{formatPerms(propsModal.detail)}</span>
              </div>
              {propsModal.detail.mtimeMs && (
                <div className={styles.propsRow}>
                  <span className={styles.propsLabel}>Modified</span>
                  <span className={styles.propsValue}>
                    {new Date(propsModal.detail.mtimeMs).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <Button size="sm" variant="secondary" onClick={() => setPropsModal({ entry: null, detail: null })}>
                {t('ui.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
