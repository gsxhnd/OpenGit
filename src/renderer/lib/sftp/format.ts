import type { SftpListEntry } from '@shared/types'

export function formatSize(bytes: number): string {
  if (bytes === 0) return '--'
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${bytes}B`
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString()
}

export function formatPerms(entry: SftpListEntry): string {
  if (entry.longname) {
    const match = entry.longname.match(/^([d-][rwx-]{9}|[d-][rwx-]{9}[+@])/)
    if (match) return match[1]
  }
  return entry.isDirectory ? 'd---------' : '----------'
}
