import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { XtermPane } from '../components/XtermPane'
import { RemoteMonacoEditor } from '../components/RemoteMonacoEditor'
import type { SftpListEntry } from '@shared/types'
import { Folder, File, ArrowUp, Upload, Download, Plus, X } from 'lucide-react'
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

/** Per-session UI state */
interface SessionUIState {
  shellReady: boolean
  cwd: string
  entries: SftpListEntry[]
  loadingDir: boolean
  editor: { path: string; text: string } | null
  transfer: { kind: 'upload' | 'download'; path: string; bytes: number; total: number; done: boolean } | null
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

  // Per-session UI state map
  const stateMapRef = useRef<Map<string, SessionUIState>>(new Map())
  function getState(): SessionUIState {
    let s = stateMapRef.current.get(cid)
    if (!s) {
      s = { shellReady: false, cwd: '/', entries: [], loadingDir: false, editor: null, transfer: null }
      stateMapRef.current.set(cid, s)
    }
    return s
  }

  const [, rerender] = useReducer((n: number) => n + 1, 0)

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
    // Sync active session
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

  // Refresh SFTP listing
  useEffect(() => {
    if (meta) void refreshDir()
  }, [refreshDir, meta])

  // Cleanup on unmount (tab close)
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
      s.transfer = {
        kind: payload.kind,
        path: payload.remotePath,
        bytes: payload.bytes,
        total: payload.total,
        done: payload.done,
      }
      if (payload.done && payload.error) {
        addToast(payload.error, 'error')
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
      const text = await window.api.sftpReadFileText(cid, remotePath)
      const s = getState()
      s.editor = { path: remotePath, text }
      rerender()
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('editor.openFileFailed'), 'error')
    }
  }

  const handleEntryClick = (e: SftpListEntry) => {
    const s = getState()
    const path = joinRemote(s.cwd, e.name)
    if (e.isDirectory) {
      s.cwd = path
      s.editor = null
      rerender()
    } else {
      void openFile(path)
    }
  }

  const navigateTo = (target: string) => {
    const s = getState()
    s.cwd = target
    s.editor = null
    rerender()
  }

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

  if (!meta) {
    return null
  }

  const st = getState()

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
          <div className={styles.path}>{st.cwd}</div>
          {st.transfer && !st.transfer.done && (
            <div className={styles.transferBar}>
              <div className={styles.transferInfo}>
                {st.transfer.kind === 'upload' ? '↑' : '↓'}{' '}
                {st.transfer.path.split('/').pop()}
              </div>
              {st.transfer.total > 0 && (
                <div className={styles.transferProgress}>
                  <div
                    className={styles.transferFill}
                    style={{ width: `${Math.round((st.transfer.bytes / st.transfer.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
          <ul className={styles.list}>
            {st.loadingDir && <li className={styles.muted}>{t('session.loading')}</li>}
            {!st.loadingDir &&
              st.entries.map((e) => (
                <li key={e.name} className={styles.row}>
                  <button type="button" className={styles.entryBtn} onClick={() => handleEntryClick(e)}>
                    {e.isDirectory ? <Folder size={14} /> : <File size={14} />}
                    <span className={styles.entryName}>{e.name}</span>
                    {!e.isDirectory && (
                      <span className={styles.entrySize}>
                        {e.size >= 1024 * 1024
                          ? `${(e.size / (1024 * 1024)).toFixed(1)}M`
                          : e.size >= 1024
                            ? `${(e.size / 1024).toFixed(1)}K`
                            : `${e.size}B`}
                      </span>
                    )}
                  </button>
                  {!e.isDirectory && (
                    <Button size="icon" variant="ghost" className={styles.dl} onClick={() => void handleDownload(e)}>
                      <Download size={14} />
                    </Button>
                  )}
                </li>
              ))}
          </ul>
        </aside>

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
    </div>
  )
}
