import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { XtermPane } from '../components/XtermPane'
import { RemoteMonacoEditor } from '../components/RemoteMonacoEditor'
import type { SftpListEntry } from '@shared/types'
import { Folder, File, ArrowUp, Upload, Download } from 'lucide-react'
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

export function SessionView() {
  const { connectionId } = useParams<{ connectionId: string }>()
  const navigate = useNavigate()
  const { activeRemoteSession, setActiveRemoteSession, settings, addToast } = useAppStore()
  const [shellReady, setShellReady] = useState(false)
  const [cwd, setCwd] = useState('/')
  const [entries, setEntries] = useState<SftpListEntry[]>([])
  const [loadingDir, setLoadingDir] = useState(false)
  const [editor, setEditor] = useState<{ path: string; text: string } | null>(null)

  const cid = connectionId || ''
  const meta = activeRemoteSession
  const t = settings?.terminal
  const ed = settings?.editor

  const refreshDir = useCallback(async () => {
    if (!cid) return
    setLoadingDir(true)
    try {
      const list = await window.api.sftpReaddir(cid, cwd)
      setEntries(list)
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'SFTP list failed', 'error')
    } finally {
      setLoadingDir(false)
    }
  }, [cid, cwd, addToast])

  useEffect(() => {
    if (!cid || !meta || meta.connectionId !== cid) {
      addToast('Invalid or expired session', 'error')
      navigate('/')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await window.api.sshShellStart(cid)
        if (!cancelled) setShellReady(true)
      } catch (e: unknown) {
        addToast(e instanceof Error ? e.message : 'Shell failed', 'error')
        navigate('/')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cid, meta, navigate, addToast])

  useEffect(() => {
    void refreshDir()
  }, [refreshDir])

  useEffect(() => {
    return () => {
      if (cid) {
        void window.api.sshDisconnect(cid)
      }
      setActiveRemoteSession(null)
    }
  }, [cid, setActiveRemoteSession])

  const disconnect = async () => {
    await window.api.sshDisconnect(cid)
    setActiveRemoteSession(null)
    navigate('/')
  }

  const openFile = async (remotePath: string) => {
    try {
      const text = await window.api.sftpReadFileText(cid, remotePath)
      setEditor({ path: remotePath, text })
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Open file failed', 'error')
    }
  }

  const handleEntryClick = (e: SftpListEntry) => {
    const path = joinRemote(cwd, e.name)
    if (e.isDirectory) {
      setCwd(path)
      setEditor(null)
    } else {
      void openFile(path)
    }
  }

  const handleUpload = async () => {
    const local = await window.api.openFile()
    if (!local) return
    const base = local.split(/[/\\]/).pop() || 'upload.bin'
    const remotePath = joinRemote(cwd, base)
    try {
      await window.api.sftpUploadFromLocal(cid, remotePath, local)
      addToast('Uploaded', 'success')
      await refreshDir()
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Upload failed', 'error')
    }
  }

  const handleDownload = async (entry: SftpListEntry) => {
    if (entry.isDirectory) return
    const remotePath = joinRemote(cwd, entry.name)
    const local = await window.api.saveFile(entry.name)
    if (!local) return
    try {
      await window.api.sftpDownloadToLocal(cid, remotePath, local)
      addToast('Downloaded', 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Download failed', 'error')
    }
  }

  if (!meta || meta.connectionId !== cid) {
    return null
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <span className={styles.badge}>SSH</span>
          <span className={styles.sessionTitle}>
            {meta.username}@{meta.host}:{meta.port}
          </span>
        </div>
        <div className={styles.headerActions}>
          <Button size="sm" variant="destructive" onClick={() => void disconnect()}>
            Disconnect
          </Button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sftp}>
          <div className={styles.sftpToolbar}>
            <Button size="sm" variant="ghost" title="Parent" onClick={() => setCwd(parentPath(cwd))}>
              <ArrowUp size={16} />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void handleUpload()}>
              <Upload size={14} className="mr-1" />
              Upload
            </Button>
          </div>
          <div className={styles.path}>{cwd}</div>
          <ul className={styles.list}>
            {loadingDir && <li className={styles.muted}>Loading…</li>}
            {!loadingDir &&
              entries.map((e) => (
                <li key={e.name} className={styles.row}>
                  <button type="button" className={styles.entryBtn} onClick={() => handleEntryClick(e)}>
                    {e.isDirectory ? <Folder size={14} /> : <File size={14} />}
                    <span className={styles.entryName}>{e.name}</span>
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
            {shellReady ? (
              <XtermPane
                mode={{ kind: 'ssh', connectionId: cid }}
                fontSize={t?.fontSize ?? 14}
                fontFamily={t?.fontFamily ?? 'Menlo, Monaco, monospace'}
                scrollback={t?.scrollback ?? 5000}
                onExit={() => addToast('Shell closed', 'info')}
              />
            ) : (
              <div className={styles.muted}>Starting shell…</div>
            )}
          </div>
          {editor && ed && (
            <div className={styles.editorArea}>
              <RemoteMonacoEditor
                key={editor.path}
                connectionId={cid}
                remotePath={editor.path}
                initialText={editor.text}
                fontSize={ed.fontSize}
                tabSize={ed.tabSize}
                wordWrap={ed.wordWrap}
                minimap={ed.minimap}
                onClose={() => setEditor(null)}
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
