/**
 * Workbench shell tooltips — thin wrapper around Base UI `Tooltip` for consistent delay and placement.
 */
import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export interface ShellTooltipProps {
  content: string
  /** @default 'bottom' */
  side?: 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end'
  /** Hover delay before open (ms). @default 400 */
  delay?: number
  /** Trigger element (e.g. `NavLink` or `Button` via `render` slot). */
  children: ReactElement
}

export function ShellTooltip({ content, side = 'bottom', delay = 400, children }: ShellTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger delay={delay} closeDelay={0} render={children} />
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  )
}
