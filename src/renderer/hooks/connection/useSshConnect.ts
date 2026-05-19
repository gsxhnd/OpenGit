import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@renderer/store'
import { useShallow } from 'zustand/react/shallow'
import type { HostProfile, SshConnectPayload } from '@shared/types'
import { useRecentConnections } from './use-recent-connections'

export function useSshConnect() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addSession, addToast } = useAppStore(useShallow((s) => ({ addSession: s.addSession, addToast: s.addToast })))
  const { recordRecent } = useRecentConnections()
  const [connecting, setConnecting] = useState(false)

  const doConnect = useCallback(
    async (payload: SshConnectPayload, meta: { hostLabel: string; hostProfileId?: string }) => {
      setConnecting(true)
      try {
        const { connectionId, fingerprint, isNewHost } = await window.api.sshConnect(payload)
        addSession({
          connectionId,
          hostLabel: meta.hostLabel,
          username: payload.username,
          host: payload.host,
          port: payload.port,
          fingerprint,
        })
        recordRecent({
          hostLabel: meta.hostLabel,
          host: payload.host,
          port: payload.port,
          username: payload.username,
          hostProfileId: meta.hostProfileId,
        })
        if (isNewHost) {
          addToast(t('welcome.newHostKey', { fingerprint }), 'info')
        } else {
          addToast(t('welcome.connected', { fingerprint }), 'info')
        }
        navigate(`/session/${connectionId}`)
      } catch (e: unknown) {
        addToast(e instanceof Error ? e.message : t('err.connectionFailed'), 'error')
      } finally {
        setConnecting(false)
      }
    },
    [addSession, addToast, navigate, recordRecent, t],
  )

  const connectSaved = useCallback(
    async (host: HostProfile) => {
      const pass = host.password
      const keyPath = host.privateKeyPath
      if (host.authType === 'password' && !pass) {
        addToast(t('welcome.noPasswordStored'), 'error')
        return
      }
      if (host.authType === 'privateKey' && !keyPath) {
        addToast(t('welcome.noKeyPath'), 'error')
        return
      }

      await doConnect(
        {
          host: host.host,
          port: host.port || 22,
          username: host.username,
          password: host.authType === 'password' ? pass : undefined,
          privateKeyPath: host.authType === 'privateKey' ? keyPath : undefined,
          passphrase: host.passphrase,
          expectedFingerprint: host.trustedFingerprint,
        },
        { hostLabel: host.label, hostProfileId: host.id },
      )
    },
    [addToast, doConnect, t],
  )

  return {
    connecting,
    doConnect,
    connectSaved,
  }
}
