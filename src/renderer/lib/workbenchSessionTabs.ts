/**
 * Derives the workbench session tab strip from store data (Phase 0 / docs session model).
 * Local shell is always first; each SSH row maps to `RemoteSessionMeta`.
 */
import type { RemoteSessionMeta, WorkbenchSessionTabModel } from '@shared/types'

/** Reserved `connectionId` / `id` for the local terminal row (never a UUID). */
export const LOCAL_WORKBENCH_TAB_ID = '__puck_local_terminal__'

export function buildWorkbenchSessionTabs(
  sessions: RemoteSessionMeta[],
  localTabTitle: string,
): WorkbenchSessionTabModel[] {
  const local: WorkbenchSessionTabModel = {
    id: LOCAL_WORKBENCH_TAB_ID,
    connectionId: LOCAL_WORKBENCH_TAB_ID,
    connectionType: 'local-terminal',
    title: localTabTitle,
    status: 'connected',
    routePath: '/local-terminal',
    closable: false,
  }

  const sshTabs: WorkbenchSessionTabModel[] = sessions.map((s) => ({
    id: s.connectionId,
    connectionId: s.connectionId,
    connectionType: 'ssh',
    title: s.hostLabel,
    status: s.status || 'connected',
    routePath: `/session/${s.connectionId}`,
    closable: true,
  }))

  return [local, ...sshTabs]
}

/** Whether the current pathname selects the given tab (exact or normalized). */
export function isWorkbenchTabActive(tab: WorkbenchSessionTabModel, pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  if (tab.connectionType === 'local-terminal') {
    return p === '/local-terminal' || p.startsWith('/local-terminal/')
  }
  return p === tab.routePath || p.startsWith(`${tab.routePath}/`)
}
