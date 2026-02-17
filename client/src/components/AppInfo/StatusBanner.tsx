import { useLocation } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { Routes } from '@/lib/constants'
import { useGuestMode } from '@/providers/GuestModeProvider'
import { useSyncSafe } from '@/providers/SyncProvider'
import { authPaths } from '~/shared/constants'

export const StatusBanner = () => {
  const { isGuestMode, exitGuestMode } = useGuestMode()
  const sync = useSyncSafe()
  const [location] = useLocation()

  // Hide guest mode banner on How To Use page
  if (isGuestMode && location === Routes.HOW_TO_USE) {
    return null
  }

  if (isGuestMode) {
    return (
      <div
        className="sticky top-0 z-50 bg-primary/90 text-primary-foreground px-4 py-2 flex items-center justify-center gap-4 text-sm"
        data-testid="banner-guest-mode"
      >
        <span>Log in to back up your data and use it across devices.</span>
        <a href={authPaths.login}>
          <Button
            size="sm"
            variant="secondary"
            className="h-7"
            data-testid="button-banner-signup"
          >
            Sign Up
          </Button>
        </a>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-primary-foreground hover:bg-white/20"
          onClick={exitGuestMode}
          data-testid="button-banner-exit"
        >
          Exit
        </Button>
      </div>
    )
  }

  if (sync && !sync.isOnline) {
    return (
      <div
        className="sticky top-0 z-50 bg-yellow-600/90 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm"
        data-testid="banner-offline"
      >
        <span>You are offline. Changes will sync when you reconnect.</span>
        {sync.pendingCount > 0 && (
          <span className="opacity-75">({sync.pendingCount} pending)</span>
        )}
      </div>
    )
  }

  return null
}
