import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'

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
        <h1 className="text-3xl font-bold text-foreground mb-2">OpenGit</h1>
        <p className="text-muted-foreground">A modern Git GUI</p>
      </div>

      <Button onClick={handleOpen} size="lg">
        Open Repository
      </Button>

      <p className="text-xs text-muted-foreground">
        Or drag and drop a folder here
      </p>
    </motion.div>
  )
}
