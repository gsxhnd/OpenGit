import { useAppStore } from '../store'
import styles from './StatusBar.module.scss'

export function StatusBar() {
  const { repoStatus } = useAppStore()

  if (!repoStatus) return null

  const { status, ahead, behind } = repoStatus
  const unstagedCount =
    status.unstagedFiles.length + status.untrackedFiles.length
  const stagedCount = status.stagedFiles.length

  return (
    <footer className={styles.footer}>
      <div className={styles.leftSection}>
        {status.currentBranch && (
          <span className={styles.branchInfo}>
            <svg className={styles.branchIcon} viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
            </svg>
            {status.currentBranch}
          </span>
        )}
        {(ahead > 0 || behind > 0) && (
          <span className={styles.syncInfo}>
            {ahead > 0 && `↑${ahead}`}
            {behind > 0 && ` ↓${behind}`}
          </span>
        )}
      </div>
      <div className={styles.rightSection}>
        {unstagedCount > 0 && <span>{unstagedCount} unstaged</span>}
        {stagedCount > 0 && <span>{stagedCount} staged</span>}
        {status.mergeHead && (
          <span className={styles.merging}>MERGING</span>
        )}
      </div>
    </footer>
  )
}
