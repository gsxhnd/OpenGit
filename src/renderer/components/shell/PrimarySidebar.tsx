import { NavLink, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Folder, LayoutDashboard, MonitorPlay, Plug, Search, Server, Settings, TerminalSquare } from 'lucide-react'
import { useAppStore } from '../../store'
import styles from './PrimarySidebar.module.scss'

function getSection(pathname: string) {
  if (pathname.startsWith('/connections')) return 'connections'
  if (pathname.startsWith('/session') || pathname.startsWith('/sessions') || pathname.startsWith('/local-terminal')) return 'sessions'
  if (pathname.startsWith('/files')) return 'files'
  if (pathname.startsWith('/settings')) return 'settings'
  return 'dashboard'
}

export function PrimarySidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { sessions, settings } = useAppStore()
  const section = getSection(location.pathname)
  const hosts = settings?.hosts ?? []

  const linkClass = (active: boolean) => (active ? styles.linkActive : styles.link)

  const renderHeader = () => {
    const meta = {
      dashboard: [t('workbench.dashboard'), t('welcome.subtitle')],
      connections: [t('workbench.connections'), t('workbench.connectionsHint')],
      sessions: [t('workbench.sessions'), t('workbench.sessionsHint')],
      files: [t('workbench.files'), t('workbench.filesHint')],
      settings: [t('settings.title'), t('settings.shortcuts')],
    }[section]

    return (
      <header className={styles.header}>
        <div className={styles.title}>{meta[0]}</div>
        <div className={styles.subtitle}>{meta[1]}</div>
      </header>
    )
  }

  const renderSearch = () => (
    <label className={styles.search}>
      <Search size={14} />
      <input placeholder={t('ui.search')} />
    </label>
  )

  const renderDashboard = () => (
    <>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t('workbench.navigation')}</div>
        <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
          <LayoutDashboard size={14} />
          {t('workbench.dashboard')}
        </NavLink>
        <NavLink to="/connections" className={({ isActive }) => linkClass(isActive)}>
          <Plug size={14} />
          {t('workbench.connections')}
        </NavLink>
        <NavLink to="/sessions" className={() => linkClass(location.pathname.startsWith('/sessions') || location.pathname.startsWith('/session/'))}>
          <MonitorPlay size={14} />
          {t('workbench.sessions')}
        </NavLink>
        <NavLink to="/files" className={({ isActive }) => linkClass(isActive)}>
          <Folder size={14} />
          {t('workbench.files')}
        </NavLink>
      </div>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t('welcome.quickConnect')}</div>
        <button type="button" className={styles.action} onClick={() => navigate('/local-terminal')}>
          <TerminalSquare size={14} />
          {t('welcome.localTerminal')}
        </button>
      </div>
    </>
  )

  const renderConnections = () => (
    <>
      {renderSearch()}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t('welcome.savedHosts')}</div>
        {hosts.length === 0 ? (
          <div className={styles.empty}>{t('workbench.noSavedConnections')}</div>
        ) : (
          hosts.map((host) => (
            <NavLink key={host.id} to="/connections" className={({ isActive }) => linkClass(isActive)}>
              <Server size={14} />
              <span className={styles.truncate}>{host.label}</span>
            </NavLink>
          ))
        )}
      </div>
    </>
  )

  const renderSessions = () => (
    <div className={styles.group}>
      <div className={styles.groupTitle}>{t('workbench.sessions')}</div>
      <NavLink to="/local-terminal" className={({ isActive }) => linkClass(isActive)}>
        <TerminalSquare size={14} />
        {t('nav.localShell')}
      </NavLink>
      {sessions.length === 0 ? (
        <div className={styles.empty}>{t('workbench.noActiveSessions')}</div>
      ) : (
        sessions.map((session) => (
          <NavLink
            key={session.connectionId}
            to={`/session/${session.connectionId}`}
            className={({ isActive }) => linkClass(isActive)}
          >
            <Server size={14} />
            <span className={styles.truncate}>{session.hostLabel}</span>
          </NavLink>
        ))
      )}
    </div>
  )

  const renderFiles = () => (
    <div className={styles.group}>
      <div className={styles.groupTitle}>{t('workbench.remoteFiles')}</div>
      {sessions.length === 0 ? (
        <div className={styles.empty}>{t('workbench.noRemoteFiles')}</div>
      ) : (
        sessions.map((session) => (
          <NavLink
            key={session.connectionId}
            to={`/session/${session.connectionId}`}
            className={({ isActive }) => linkClass(isActive)}
          >
            <Folder size={14} />
            <span className={styles.truncate}>{session.hostLabel}</span>
          </NavLink>
        ))
      )}
    </div>
  )

  const renderSettings = () => (
    <div className={styles.group}>
      <div className={styles.groupTitle}>{t('settings.title')}</div>
      <button type="button" className={styles.linkActive}>
        <Settings size={14} />
        {t('settings.appearance')}
      </button>
      <button type="button" className={styles.action}>
        <TerminalSquare size={14} />
        {t('settings.terminal')}
      </button>
      <button type="button" className={styles.action}>
        <Plug size={14} />
        {t('settings.remoteHosts')}
      </button>
    </div>
  )

  return (
    <aside className={styles.sidebar} aria-label="Primary Sidebar">
      {renderHeader()}
      {section === 'dashboard' && renderDashboard()}
      {section === 'connections' && renderConnections()}
      {section === 'sessions' && renderSessions()}
      {section === 'files' && renderFiles()}
      {section === 'settings' && renderSettings()}
    </aside>
  )
}
