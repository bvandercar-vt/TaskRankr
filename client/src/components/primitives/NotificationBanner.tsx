import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import { IconSize } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface NotificationBannerProps {
  storageKey: string
  icon: LucideIcon
  children: React.ReactNode
  hidden?: boolean
  'data-testid'?: string
}

export const NotificationBanner = ({
  storageKey,
  icon: Icon,
  children,
  hidden = false,
  'data-testid': testId,
}: NotificationBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(storageKey) === 'true'
        setIsDismissed(dismissed)
      }
    } catch {
      setIsDismissed(true)
    }
    setHasLoaded(true)
  }, [storageKey])

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // noop
    }
    setIsDismissed(true)
  }

  if (!hasLoaded || isDismissed || hidden) return null

  return (
    <div
      className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-2 flex items-center justify-between gap-3"
      data-testid={testId}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={cn(IconSize.HW5, 'shrink-0 text-primary')} />
        <span className="text-sm text-foreground">{children}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        data-testid={
          testId ? `button-dismiss-${testId.replace('banner-', '')}` : undefined
        }
      >
        <X className={IconSize.HW4} />
      </Button>
    </div>
  )
}
