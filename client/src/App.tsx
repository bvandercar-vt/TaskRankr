/**
 * @fileoverview Main application component with routing and provider setup
 */

import { useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Route, Switch, useLocation } from 'wouter'

import { Toaster } from '@/components/primitives/overlays/Toaster'
import { TooltipProvider } from '@/components/primitives/overlays/Tooltip'
import { ExpandedTasksProvider } from '@/components/providers/ExpandedTasksProvider'
import {
  GuestModeProvider,
  useGuestMode,
} from '@/components/providers/GuestModeProvider'
import {
  LocalStateProvider,
  StorageMode,
} from '@/components/providers/LocalStateProvider'
import { SyncProvider } from '@/components/providers/SyncProvider'
import { TaskFormDialogProvider } from '@/components/providers/TaskFormDialogProvider'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  clearGuestStorage,
  migrateGuestTasksToAuth,
} from '@/lib/migrate-guest-tasks'
import Completed from '@/pages/Completed'
import Home from '@/pages/Home'
import HowToUse from '@/pages/HowToUse'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'
import Settings from '@/pages/Settings'
import { StatusBanner } from './components/StatusBanner'
import { Routes } from './lib/constants'
import { queryClient } from './lib/query-client'

const ScrollToTop = () => {
  const [location] = useLocation()
  // biome-ignore lint/correctness/useExhaustiveDependencies: needs it
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])
  return null
}

const Router = () => (
  <>
    <ScrollToTop />
    <Switch>
      <Route path={Routes.HOME} component={Home} />
      <Route path={Routes.COMPLETED} component={Completed} />
      <Route path={Routes.SETTINGS} component={Settings} />
      <Route path={Routes.HOW_TO_USE} component={HowToUse} />
      <Route component={NotFound} />
    </Switch>
  </>
)

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
          description: `${result.migratedCount} tasks from guest mode have been added to your account.`,
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
  const storageMode = isGuestMode ? StorageMode.GUEST : StorageMode.AUTH

  return (
    <LocalStateProvider shouldSync={shouldSync} storageMode={storageMode}>
      <SyncProvider isAuthenticated={shouldSync}>
        <ExpandedTasksProvider>
          <TaskFormDialogProvider>
            <StatusBanner />
            <Router />
          </TaskFormDialogProvider>
        </ExpandedTasksProvider>
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
