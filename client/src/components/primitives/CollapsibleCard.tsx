import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Card } from '@/components/primitives/Card'
import { cn } from '@/lib/utils'
import { IconSizeStyle } from '@/lib/constants'

export const CollapsibleCard = ({
  title,
  children,
  className,
  'data-testid': testId,
}: React.PropsWithChildren<{
  title: string
  className?: string
  'data-testid'?: string
}>) => {
  const [open, setOpen] = useState(false)
  return (
    <Card className={className}>
      <button
        type="button"
        className="flex items-center justify-between w-full text-left"
        onClick={() => setOpen(!open)}
        data-testid={testId}
      >
        <h3 className="font-semibold text-muted-foreground">{title}</h3>
        <ChevronDown
          className={cn(
            IconSizeStyle.HW4,
            'text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </Card>
  )
}
