import type { ViewType } from '@shared/types'
import { DashboardView } from './views/DashboardView'
import { ConnectionsView } from './views/ConnectionsView'
import { LocalTerminalView } from './views/LocalTerminalView'
import { SessionView } from './views/SessionView'
import { SessionsOverviewView } from './views/SessionsOverviewView'
import { FilesView } from './views/FilesView'
const VIEW_TO_PATH: Record<ViewType, string> = {
  dashboard: '/',
  connections: '/connections',
  'local-terminal': '/local-terminal',
  session: '/sessions',
  files: '/files',
  settings: '/settings',
}

const PATH_TO_VIEW: Record<string, ViewType> = {
  '/': 'dashboard',
  '/connections': 'connections',
  '/local-terminal': 'local-terminal',
  '/sessions': 'session',
  '/files': 'files',
  '/session': 'session',
  '/settings': 'settings',
}

export function viewToPath(view: ViewType): string {
  return VIEW_TO_PATH[view] || '/'
}

export function pathToView(pathname: string): ViewType {
  if (pathname.startsWith('/session')) return 'session'
  return PATH_TO_VIEW[pathname] || 'dashboard'
}

export const SETTINGS_PATH = '/settings'

export const workbenchRoutes = [
  { path: '/', element: <DashboardView /> },
  { path: '/connections', element: <ConnectionsView /> },
  { path: '/local-terminal', element: <LocalTerminalView /> },
  { path: '/sessions', element: <SessionsOverviewView /> },
  { path: '/session/:connectionId', element: <SessionView /> },
  { path: '/files', element: <FilesView /> },
] as const
