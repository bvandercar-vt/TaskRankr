import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

  const TitleElement =
    typeof title === 'string' ? (
      <h3 className="font-semibold text-muted-foreground">{title}</h3>
    ) : (
      title
    )

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: TODO: fix with onKey
    // biome-ignore lint/a11y/noStaticElementInteractions: TODO: better a11y
    <div
      className={cn(
        !noCard && 'p-4 bg-card rounded-lg border border-white/10',
        !open && 'cursor-pointer',
        className,
      )}
      onClick={!open ? () => setOpen(true) : undefined}
    >
      <button
        type="button"
        className={cn(
          'flex items-center justify-between w-full text-left',
          triggerClassName,
        )}
        onClick={(e) => {
          if (open) {
            e.stopPropagation()
            setOpen(false)
          }
        }}
        data-testid={testId}
      >
        {TitleElement}
        <ChevronDown
          className={cn(
            IconSizeStyle.HW4,
            'text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn('mt-4', contentClassName)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
