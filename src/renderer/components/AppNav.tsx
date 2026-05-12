import { NavLink } from 'react-router'
import { Home, Terminal, Settings } from 'lucide-react'
import styles from './AppNav.module.scss'

export function AppNav() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : styles.link)} end>
        <Home size={18} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/local-terminal" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
        <Terminal size={18} />
        <span>Local shell</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
        <Settings size={18} />
        <span>Settings</span>
      </NavLink>
    </nav>
  )
}
