import { motion } from 'motion/react'
import { useAppStore } from '../store'

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
      className="flex flex-col items-center justify-center h-full gap-6"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">OpenGit</h1>
        <p className="text-[var(--color-muted-foreground)]">A modern Git GUI</p>
      </div>

      <button
        onClick={handleOpen}
        className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Open Repository
      </button>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Or drag and drop a folder here
      </p>
    </motion.div>
  )
}
