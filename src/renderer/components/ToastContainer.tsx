import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed bottom-8 right-4 flex flex-col gap-2 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'pointer-events-auto px-4 py-2 rounded-md shadow-lg text-sm cursor-pointer',
              'border border-border',
              toast.kind === 'success' && 'bg-muted text-success',
              toast.kind === 'error' && 'bg-muted text-destructive',
              toast.kind === 'info' && 'bg-muted text-info'
            )}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
