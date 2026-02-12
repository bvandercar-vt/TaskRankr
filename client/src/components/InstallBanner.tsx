import { useEffect, useState } from 'react'
import { isStandalonePWA } from 'is-standalone-pwa'
import { Download, X } from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { IconSize, Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'

const INSTALL_BANNER_KEY = 'taskrankr-install-dismissed'

export const InstallBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(INSTALL_BANNER_KEY) === 'true'
        setIsDismissed(dismissed || isStandalonePWA())
      }
    } catch {
      setIsDismissed(true)
    }
    setHasLoaded(true)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(INSTALL_BANNER_KEY, 'true')
    } catch {
      // noop
    }
    setIsDismissed(true)
  }

  if (!hasLoaded || isDismissed) return null

  return (
    <div
      className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3"
      data-testid="banner-install"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Download className={cn(IconSize.HW5, 'shrink-0 text-primary')} />
        <span className="text-sm text-foreground">
          Install the app!{' '}
          <Link href={Routes.HOW_TO_INSTALL}>
            <span
              className="text-primary underline underline-offset-2 cursor-pointer"
              data-testid="link-install-banner"
            >
              Learn how to install
            </span>
          </Link>
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        data-testid="button-dismiss-install"
      >
        <X className={IconSize.HW4} />
      </Button>
    </div>
  )
}
