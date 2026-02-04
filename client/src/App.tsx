/**
 * @fileoverview Main application component with routing and provider setup
 */

import { useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Route, Switch } from 'wouter'

import { GuestModeProvider, useGuestMode } from '@/components/GuestModeProvider'
import { LocalStateProvider } from '@/components/LocalStateProvider'
import { Button } from '@/components/primitives/button'
import { Toaster } from '@/components/primitives/overlays/toaster'
import { TooltipProvider } from '@/components/primitives/overlays/tooltip'
import { SyncProvider, useSyncSafe } from '@/components/SyncProvider'
import { TaskDialogProvider } from '@/components/TaskDialogProvider'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  clearGuestStorage,
  migrateGuestTasksToAuth,
} from '@/lib/migrate-guest-tasks'
import Completed from '@/pages/Completed'
import Home from '@/pages/Home'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'
import Settings from '@/pages/Settings'
import { authPaths } from '~/shared/constants'
import { queryClient } from './lib/query-client'

const Router = () => (
  <Switch>
    <Route path="/" component={Home} />
    <Route path="/completed" component={Completed} />
    <Route path="/settings" component={Settings} />
    <Route component={NotFound} />
  </Switch>
)

const StatusBanner = () => {
  const { isGuestMode, exitGuestMode } = useGuestMode()
  const sync = useSyncSafe()

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

  if (sync && sync.pendingCount > 0 && sync.isSyncing) {
    return (
      <div
        className="sticky top-0 z-50 bg-blue-600/90 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm"
        data-testid="banner-syncing"
      >
        <span>Syncing changes...</span>
      </div>
    )
  }

  return null
}

const AuthenticatedApp = () => {
  const { isLoading, isAuthenticated } = useAuth()
  const { isGuestMode } = useGuestMode()
  const { toast } = useToast()
  const hasMigrated = useRef(false)

  useEffect(() => {
    if (isAuthenticated && !isGuestMode && !hasMigrated.current) {
      hasMigrated.current = true
      const result = migrateGuestTasksToAuth()
      if (result.migratedCount > 0) {
        clearGuestStorage()
        toast({
          title: 'Tasks imported',
          description: `${result.migratedCount} task${result.migratedCount === 1 ? '' : 's'} from guest mode ${result.migratedCount === 1 ? 'has' : 'have'} been added to your account.`,
        })
      }
    }
  }, [isAuthenticated, isGuestMode, toast])

  if (isLoading && !isGuestMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated && !isGuestMode) {
    return <Landing />
  }

  const shouldSync = isAuthenticated && !isGuestMode
  const storageMode = isGuestMode ? 'guest' : 'auth'

  return (
    <LocalStateProvider shouldSync={shouldSync} storageMode={storageMode}>
      <SyncProvider isAuthenticated={shouldSync}>
        <TaskDialogProvider>
          <StatusBanner />
          <Router />
        </TaskDialogProvider>
      </SyncProvider>
    </LocalStateProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GuestModeProvider>
        <Toaster />
        <AuthenticatedApp />
      </GuestModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
