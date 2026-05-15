import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import type { SftpListEntry } from '@shared/types'
import type { SessionUIState } from '../components/session/types'
import { joinRemote } from '../lib/sftp/path'
import { formatSize } from '../lib/sftp/format'

export function useSessionSftpOperations(
  cid: string,
  getState: () => SessionUIState,
  rerender: () => void,
  refreshDir: () => Promise<void>,
) {
  const { t } = useTranslation()
  const { addToast } = useAppStore(useShallow((s) => ({ addToast: s.addToast })))

  const openFile = useCallback(async (remotePath: string) => {
    try {
      let stat: SftpListEntry | null = null
      try {
        stat = await window.api.sftpStat(cid, remotePath)
      } catch {
        // proceed anyway
      }
      const WARN_SIZE = 1024 * 1024
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
  }, [cid, getState, rerender, addToast, t])

  const navigateTo = useCallback((target: string) => {
    const s = getState()
    s.cwd = target
    s.editor = null
    rerender()
  }, [getState, rerender])

  const handleNewFolder = useCallback((
    setNewFolderValue: (v: string) => void,
    setNewFolderPrompt: (v: boolean) => void,
  ) => {
    setNewFolderValue('')
    setNewFolderPrompt(true)
  }, [])

  const submitNewFolder = useCallback(async (
    newFolderValue: string,
    setNewFolderPrompt: (v: boolean) => void,
  ) => {
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
  }, [cid, getState, addToast, t, refreshDir])

  const handleRename = useCallback((entry: SftpListEntry) => {
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
  }, [cid, getState, addToast, t, refreshDir])

  const handleDelete = useCallback((entry: SftpListEntry) => {
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
  }, [cid, getState, addToast, t, refreshDir])

  const handleProperties = useCallback(async (entry: SftpListEntry) => {
    const s = getState()
    const path = joinRemote(s.cwd, entry.name)
    try {
      const detail = await window.api.sftpStat(cid, path)
      return { entry, detail }
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Stat failed', 'error')
      return null
    }
  }, [cid, getState, addToast])

  const handleUpload = useCallback(async () => {
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
  }, [cid, getState, addToast, t, refreshDir])

  const handleDownload = useCallback(async (entry: SftpListEntry) => {
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
  }, [cid, getState, addToast, t])

  return {
    openFile,
    navigateTo,
    handleNewFolder,
    submitNewFolder,
    handleRename,
    handleDelete,
    handleProperties,
    handleUpload,
    handleDownload,
  }
}
