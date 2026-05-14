import type { HostProfile } from '@shared/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import styles from '../../views/SettingsView.module.scss'

interface HostsSectionProps {
  labels: {
    title: string
    hint: string
    label: string
    host: string
    port: string
    username: string
    password: string
    keyPath: string
    authPassword: string
    authPrivateKey: string
    addHost: string
    remove: string
  }
  hosts: HostProfile[]
  form: {
    label: string
    host: string
    port: string
    username: string
    password: string
    keyPath: string
    authType: 'password' | 'privateKey'
  }
  onFormChange: (partial: Partial<HostsSectionProps['form']>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function HostsSection({ labels, hosts, form, onFormChange, onAdd, onRemove }: HostsSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{labels.title}</h2>
      <p className={styles.hint}>{labels.hint}</p>
      <div className={styles.fieldGroup}>
        <Input placeholder={labels.label} value={form.label} onChange={(event) => onFormChange({ label: event.target.value })} />
        <Input placeholder={labels.host} value={form.host} onChange={(event) => onFormChange({ host: event.target.value })} />
        <Input placeholder={labels.port} value={form.port} onChange={(event) => onFormChange({ port: event.target.value })} />
        <Input placeholder={labels.username} value={form.username} onChange={(event) => onFormChange({ username: event.target.value })} />
        <select value={form.authType} onChange={(event) => onFormChange({ authType: event.target.value as 'password' | 'privateKey' })} className={styles.select}>
          <option value="password">{labels.authPassword}</option>
          <option value="privateKey">{labels.authPrivateKey}</option>
        </select>
        {form.authType === 'password' ? (
          <Input type="password" placeholder={labels.password} value={form.password} onChange={(event) => onFormChange({ password: event.target.value })} />
        ) : (
          <Input placeholder={labels.keyPath} value={form.keyPath} onChange={(event) => onFormChange({ keyPath: event.target.value })} />
        )}
        <Button type="button" onClick={onAdd}>{labels.addHost}</Button>
      </div>
      <ul className={styles.hostList}>
        {hosts.map((host) => (
          <li key={host.id} className={styles.hostRow}>
            <span>{host.label} - {host.username}@{host.host}:{host.port}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(host.id)}>
              {labels.remove}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
