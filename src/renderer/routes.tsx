import type { ViewType } from '@shared/types'
import { WelcomeView } from './views/WelcomeView'
import { LocalTerminalView } from './views/LocalTerminalView'
import { SessionView } from './views/SessionView'
import { SettingsView } from './views/SettingsView'

const VIEW_TO_PATH: Record<ViewType, string> = {
  welcome: '/',
  'local-terminal': '/local-terminal',
  session: '/session',
  settings: '/settings',
}

const PATH_TO_VIEW: Record<string, ViewType> = {
  '/': 'welcome',
  '/local-terminal': 'local-terminal',
  '/session': 'session',
  '/settings': 'settings',
}

export function viewToPath(view: ViewType): string {
  return VIEW_TO_PATH[view] || '/'
}

export function pathToView(pathname: string): ViewType {
  if (pathname.startsWith('/session')) return 'session'
  return PATH_TO_VIEW[pathname] || 'welcome'
}

export const appRoutes = [
  { path: '/', element: <WelcomeView /> },
  { path: '/local-terminal', element: <LocalTerminalView /> },
  { path: '/session/:connectionId', element: <SessionView /> },
  { path: '/settings', element: <SettingsView /> },
]
