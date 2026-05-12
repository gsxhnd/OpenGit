import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Home, Terminal, Settings } from 'lucide-react'
import styles from './AppNav.module.scss'

export function AppNav() {
  const { t } = useTranslation()

  return (
    <nav className={styles.nav} aria-label="Primary">
      <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : styles.link)} end>
        <Home size={18} />
        <span>{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/local-terminal" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
        <Terminal size={18} />
        <span>{t('nav.localShell')}</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
        <Settings size={18} />
        <span>{t('nav.settings')}</span>
      </NavLink>
    </nav>
  )
}
