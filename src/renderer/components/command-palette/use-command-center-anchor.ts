import { useLayoutEffect, useState } from 'react'

const COMMAND_CENTER_SELECTOR = '[data-command-center]'

export function useCommandCenterAnchor(open: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setRect(null)
      return
    }

    const update = () => {
      const el = document.querySelector(COMMAND_CENTER_SELECTOR)
      setRect(el?.getBoundingClientRect() ?? null)
    }

    const el = document.querySelector(COMMAND_CENTER_SELECTOR)
    update()
    window.addEventListener('resize', update)

    const observer =
      el && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(update)
        : null
    if (el && observer) observer.observe(el)

    return () => {
      window.removeEventListener('resize', update)
      observer?.disconnect()
    }
  }, [open])

  return rect
}
