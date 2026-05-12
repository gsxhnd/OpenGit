import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import styles from './WelcomeView.module.scss'

export function WelcomeView() {
  const { openRepo } = useAppStore()

  const handleOpen = async () => {
    const path = await window.api.openDirectory()
    if (path) {
      openRepo(path)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.container}
    >
      <div className={styles.textCenter}>
        <h1 className={styles.title}>OpenGit</h1>
        <p className={styles.subtitle}>A modern Git GUI</p>
      </div>

      <Button onClick={handleOpen} size="lg">
        Open Repository
      </Button>

      <p className={styles.hint}>
        Or drag and drop a folder here
      </p>
    </motion.div>
  )
}
