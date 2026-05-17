import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HostProfile } from '@shared/types'
import { useAppStore } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '../ui/select'
import { settingsPanelStyles as ps } from '../settings/SettingsPanel'

export function AddHostDialog() {
  const { t } = useTranslation()
  const { addHostOpen, setAddHostOpen, loadSettings, addToast } = useAppStore(
    useShallow((s) => ({
      addHostOpen: s.addHostOpen,
      setAddHostOpen: s.setAddHostOpen,
      loadSettings: s.loadSettings,
      addToast: s.addToast,
    })),
  )

  const [label, setLabel] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [keyPath, setKeyPath] = useState('')
  const [authType, setAuthType] = useState<'password' | 'privateKey'>('password')
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setLabel('')
    setHost('')
    setUsername('')
    setPassword('')
    setKeyPath('')
    setPort('22')
    setAuthType('password')
  }

  const handleSubmit = async () => {
    if (!label.trim() || !host.trim() || !username.trim()) {
      addToast(t('settings.labelHostUsernameRequired'), 'error')
      return
    }
    setSubmitting(true)
    const profile: Omit<HostProfile, 'id'> = {
      label: label.trim(),
      host: host.trim(),
      port: Number(port) || 22,
      username: username.trim(),
      authType,
      password: authType === 'password' ? password || undefined : undefined,
      privateKeyPath: authType === 'privateKey' ? keyPath || undefined : undefined,
    }
    try {
      await window.api.hostsAdd(profile)
      resetForm()
      setAddHostOpen(false)
      await loadSettings()
      addToast(t('settings.hostSaved'), 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('err.saveFailed'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={addHostOpen} onOpenChange={(open) => { setAddHostOpen(open); if (!open) resetForm() }}>
      <DialogContent showCloseButton className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('settings.addNewHost')}</DialogTitle>
          <DialogDescription>{t('settings.remoteHostsHint')}</DialogDescription>
        </DialogHeader>

        <div className={ps.formStack}>
          <div className={ps.formGrid}>
            <div className={ps.fieldFull}>
              <Label htmlFor="ah-label">{t('settings.label')}</Label>
              <Input
                id="ah-label"
                placeholder={t('settings.label')}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className={ps.field}>
              <Label htmlFor="ah-host">{t('settings.host')}</Label>
              <Input
                id="ah-host"
                placeholder={t('settings.host')}
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
            <div className={ps.field}>
              <Label htmlFor="ah-port">{t('settings.port')}</Label>
              <Input
                id="ah-port"
                placeholder={t('settings.port')}
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
            <div className={ps.fieldFull}>
              <Label htmlFor="ah-username">{t('settings.username')}</Label>
              <Input
                id="ah-username"
                placeholder={t('settings.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className={ps.fieldFull}>
              <Label htmlFor="ah-auth">{t('settings.authType')}</Label>
              <Select
                value={authType}
                onValueChange={(value) => value && setAuthType(value as 'password' | 'privateKey')}
              >
                <SelectTrigger id="ah-auth" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="password">{t('settings.authTypePassword')}</SelectItem>
                    <SelectItem value="privateKey">{t('settings.authTypePrivateKey')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {authType === 'password' ? (
              <div className={ps.fieldFull}>
                <Label htmlFor="ah-password">{t('settings.password')}</Label>
                <Input
                  id="ah-password"
                  type="password"
                  placeholder={t('settings.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            ) : (
              <div className={ps.fieldFull}>
                <Label htmlFor="ah-keypath">{t('settings.keyPath')}</Label>
                <Input
                  id="ah-keypath"
                  placeholder={t('settings.keyPath')}
                  value={keyPath}
                  onChange={(e) => setKeyPath(e.target.value)}
                />
              </div>
            )}
          </div>
          <Button type="button" className="w-full" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? t('welcome.connecting') : t('settings.addHost')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
