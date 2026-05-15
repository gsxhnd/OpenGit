import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import type { RemoteSessionMeta } from '@shared/types'
import type { SessionUIState } from '../components/session/types'

export function useRemoteShellLifecycle(
  cid: string,
  meta: RemoteSessionMeta | undefined,
  getState: () => SessionUIState,
  rerender: () => void,
) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    sessions,
    removeSession,
    updateSessionStatus,
    addToast,
  } = useAppStore(useShallow((s) => ({
    sessions: s.sessions,
    removeSession: s.removeSession,
    updateSessionStatus: s.updateSessionStatus,
    addToast: s.addToast,
  })))

  const startRemoteShell = useCallback(
    async (softFail: boolean, cancelledRef?: { current: boolean }) => {
      if (!cid) return
      const s = getState()
      s.shellPhase = 'starting'
      updateSessionStatus(cid, 'connecting')
      rerender()
      try {
        await window.api.sshShellStart(cid)
        if (cancelledRef?.current) return
        s.shellPhase = 'connected'
        updateSessionStatus(cid, 'connected')
        rerender()
      } catch (e: unknown) {
        if (cancelledRef?.current) return
        addToast(e instanceof Error ? e.message : t('session.shellFailed'), 'error')
        s.shellPhase = 'exited'
        updateSessionStatus(cid, 'failed')
        rerender()
        if (!softFail) {
          navigate('/')
        }
      }
    },
    [cid, addToast, t, navigate, updateSessionStatus, getState, rerender],
  )

  useEffect(() => {
    if (!cid || !meta) return
    const cancelledRef = { current: false }
    void startRemoteShell(false, cancelledRef)
    return () => {
      cancelledRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid])

  const disconnect = useCallback(async () => {
    await window.api.sshDisconnect(cid)
    updateSessionStatus(cid, 'disconnected')
    removeSession(cid)
    if (sessions.length <= 1) {
      navigate('/')
    }
  }, [cid, sessions.length, navigate, removeSession, updateSessionStatus])

  useEffect(() => {
    return () => {
      if (cid) {
        void window.api.sshDisconnect(cid)
        removeSession(cid)
      }
    }
  }, [cid, removeSession])

  return { startRemoteShell, disconnect }
}
