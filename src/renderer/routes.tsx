import { lazy, Suspense } from 'react'
import type { ViewType } from '@shared/types'

const DashboardView = lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })))
const ConnectionsView = lazy(() => import('./views/ConnectionsView').then((m) => ({ default: m.ConnectionsView })))
const LocalTerminalView = lazy(() => import('./views/LocalTerminalView').then((m) => ({ default: m.LocalTerminalView })))
const SessionView = lazy(() => import('./views/SessionView').then((m) => ({ default: m.SessionView })))
const SessionsOverviewView = lazy(() => import('./views/SessionsOverviewView').then((m) => ({ default: m.SessionsOverviewView })))
const FilesView = lazy(() => import('./views/FilesView').then((m) => ({ default: m.FilesView })))

const VIEW_TO_PATH: Record<ViewType, string> = {
  dashboard: '/',
  connections: '/connections',
  'local-terminal': '/local-terminal',
  session: '/sessions',
  files: '/files',
}

const PATH_TO_VIEW: Record<string, ViewType> = {
  '/': 'dashboard',
  '/connections': 'connections',
  '/local-terminal': 'local-terminal',
  '/sessions': 'session',
  '/files': 'files',
  '/session': 'session',
}

export function viewToPath(view: ViewType): string {
  return VIEW_TO_PATH[view] || '/'
}

export function pathToView(pathname: string): ViewType {
  if (pathname.startsWith('/session')) return 'session'
  return PATH_TO_VIEW[pathname] || 'dashboard'
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

export const workbenchRoutes = [
  { path: '/', element: <LazyRoute><DashboardView /></LazyRoute> },
  { path: '/connections', element: <LazyRoute><ConnectionsView /></LazyRoute> },
  { path: '/local-terminal', element: <LazyRoute><LocalTerminalView /></LazyRoute> },
  { path: '/sessions', element: <LazyRoute><SessionsOverviewView /></LazyRoute> },
  { path: '/session/:connectionId', element: <LazyRoute><SessionView /></LazyRoute> },
  { path: '/files', element: <LazyRoute><FilesView /></LazyRoute> },
] as const
