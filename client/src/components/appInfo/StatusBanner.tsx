import { useLocation } from 'wouter'

import { Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { BannerKey, useGuestMode } from '@/providers/GuestModeProvider'
import { useSyncSafe } from '@/providers/SyncProvider'
import { authPaths } from '~/shared/constants'
import { Button } from '../primitives/Button'

const TopBanner = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'sticky top-0 z-50 px-4 py-2 flex items-center justify-center text-sm',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const StatusBanner = () => {
  const { isGuestMode, hiddenBanners, exitGuestMode } = useGuestMode()
  const sync = useSyncSafe()
  const [location] = useLocation()

  if (isGuestMode) {
    if (hiddenBanners.has(BannerKey.LOG_IN)) return null
    if (location === Routes.HOW_TO_USE) return null
    return (
      <TopBanner
        className="bg-primary/90 text-primary-foreground gap-4"
        data-testid="banner-guest-mode"
      >
        <span>Log in to back up your data and use it across devices.</span>
        <Button
          href={authPaths.LOGIN}
          size="sm"
          variant="secondary"
          className="h-7"
          data-testid="button-banner-signup"
        >
          Sign Up
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-primary-foreground hover:bg-white/20"
          onClick={exitGuestMode}
          data-testid="button-banner-exit"
        >
          Exit
        </Button>
      </TopBanner>
    )
  } else if (sync && !sync.isOnline) {
    return (
      <TopBanner
        className="bg-yellow-600/90 text-white gap-2"
        data-testid="banner-offline"
      >
        <span>You are offline. Changes will sync when you reconnect.</span>
        {sync.pendingCount > 0 && (
          <span className="opacity-75">({sync.pendingCount} pending)</span>
        )}
      </TopBanner>
    )
  }

  return null
}
