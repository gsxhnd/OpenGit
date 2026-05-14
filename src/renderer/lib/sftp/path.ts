export function joinRemote(parent: string, name: string): string {
  if (parent === '/') return `/${name}`
  return `${parent.replace(/\/$/, '')}/${name}`
}

export function parentPath(path: string): string {
  if (path === '/' || path === '') return '/'
  const trimmed = path.replace(/\/$/, '')
  const index = trimmed.lastIndexOf('/')
  if (index <= 0) return '/'
  return trimmed.slice(0, index) || '/'
}
