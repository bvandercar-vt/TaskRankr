/**
 * @fileoverview Dismissible banner linking to the "How To Use" page.
 */

import { useEffect, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { IconSizeStyle, Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'

const HOW_TO_USE_BANNER_KEY = 'taskrankr-how-to-use-dismissed'

export const HowToUseBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(HOW_TO_USE_BANNER_KEY) === 'true'
        setIsDismissed(dismissed)
      }
    } catch {
      setIsDismissed(true)
    }
    setHasLoaded(true)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(HOW_TO_USE_BANNER_KEY, 'true')
    } catch {
      // noop
    }
    setIsDismissed(true)
  }

  if (!hasLoaded || isDismissed) return null

  return (
    <div
      className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3"
      data-testid="banner-how-to-use"
    >
      <div className="flex items-center gap-3 min-w-0">
        <HelpCircle
          className={cn(IconSizeStyle.HW5, 'shrink-0 text-primary')}
        />
        <span className="text-sm text-foreground">
          New here?{' '}
          <Link href={Routes.HOW_TO_USE}>
            <span
              className="text-primary underline underline-offset-2 cursor-pointer"
              data-testid="link-how-to-use-banner"
            >
              Learn how to use the app
            </span>
          </Link>
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        data-testid="button-dismiss-how-to-use"
      >
        <X className={IconSizeStyle.HW4} />
      </Button>
    </div>
  )
}
