import { motion, AnimatePresence } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../store'
import styles from './ToastContainer.module.scss'

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore(useShallow((s) => ({ toasts: s.toasts, removeToast: s.removeToast })))

  return (
    <div className={styles.container}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`${styles.toast} ${styles[toast.kind]}`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
