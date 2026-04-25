import type { ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from './primitives/Button'
import { Icon } from './primitives/LucideIcon'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './primitives/overlays/Tooltip'

export type VisibilityAction = 'show' | 'hide'

interface VisibilityToggleButtonProps {
  /**
   * What the click will do. `'show'` renders the `Eye` icon (reveal),
   * `'hide'` renders `EyeOff` (conceal).
   */
  action: VisibilityAction
  label: ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
  /** When provided and `disabled` is true, shown in a tooltip on hover/focus. */
  disabledTooltip?: string
  'data-testid': string
}

export const VisibilityToggleButton = ({
  action,
  label,
  onClick,
  className,
  disabled,
  disabledTooltip,
  'data-testid': testId,
}: VisibilityToggleButtonProps) => {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('gap-2 disabled:opacity-50', className)}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
    >
      <Icon
        icon={action === 'show' ? Eye : EyeOff}
        className="size-3.5"
        aria-hidden
      />
      {label}
    </Button>
  )

  if (!disabled || !disabledTooltip) return button

  // Disabled buttons swallow pointer events, so wrap the
  // trigger in a span to receive hover/focus for the tooltip.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{button}</span>
      </TooltipTrigger>
      <TooltipContent>{disabledTooltip}</TooltipContent>
    </Tooltip>
  )
}
