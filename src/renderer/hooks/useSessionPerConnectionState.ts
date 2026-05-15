import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import type { SessionUIState } from '../components/session/types'

let transferIdCounter = 0

export function useSessionPerConnectionState(cid: string) {
  const { addToast } = useAppStore(useShallow((s) => ({ addToast: s.addToast })))

  const stateMapRef = useRef<Map<string, SessionUIState>>(new Map())

  const getState = useCallback((): SessionUIState => {
    let s = stateMapRef.current.get(cid)
    if (!s) {
      s = { shellPhase: 'starting', cwd: '/', entries: [], loadingDir: false, editor: null, transfers: [] }
      stateMapRef.current.set(cid, s)
    }
    return s
  }, [cid])

  const [, rerender] = useReducer((n: number) => n + 1, 0)

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
  }, [cid, addToast])

  return { getState, rerender, stateMapRef }
}
