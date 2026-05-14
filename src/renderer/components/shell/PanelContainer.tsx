import type { ReactNode } from 'react'
import styles from './PanelContainer.module.scss'

interface PanelContainerProps {
  children: ReactNode
}

export function PanelContainer({ children }: PanelContainerProps) {
  return <section className={styles.panelContainer}>{children}</section>
}
