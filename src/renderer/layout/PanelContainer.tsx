/**
 * Phase 0 — Inner wrapper of the workbench **main area** (routes and feature views),
 * sibling to Activity Bar and Primary Sidebar; keeps a single place to extend with an Inspector split later.
 */
import type { ReactNode } from 'react'
import styles from './PanelContainer.module.scss'

interface PanelContainerProps {
  children: ReactNode
}

export function PanelContainer({ children }: PanelContainerProps) {
  return <section className={styles.panelContainer}>{children}</section>
}
