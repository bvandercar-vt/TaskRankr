import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { IconSizeStyle } from '@/lib/constants'
import { cn } from '@/lib/utils'

type CollapsibleCardProps = React.PropsWithChildren<{
  title: React.ReactNode
  className?: string
  triggerClassName?: string
  contentClassName?: string
  defaultOpen?: boolean
  noCard?: boolean
  'data-testid'?: string
}>

export const CollapsibleCard = ({
  title,
  children,
  className,
  triggerClassName,
  contentClassName,
  defaultOpen = false,
  noCard = false,
  'data-testid': testId,
}: CollapsibleCardProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        !noCard && 'p-4 bg-card rounded-lg border border-white/10',
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          'flex items-center justify-between w-full text-left',
          triggerClassName,
        )}
        onClick={() => setOpen(!open)}
        data-testid={testId}
      >
        {typeof title === 'string' ? (
          <h3 className="font-semibold text-muted-foreground">{title}</h3>
        ) : (
          title
        )}
        <ChevronDown
          className={cn(
            IconSizeStyle.HW4,
            'text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className={cn('mt-4', contentClassName)}>{children}</div>}
    </div>
  )
}
