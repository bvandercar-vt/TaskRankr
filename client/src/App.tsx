/**
 * @fileoverview Main application component with routing and provider setup
 */

import { useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Route, Switch, useLocation } from 'wouter'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/primitives/overlays/Toaster'
import { TooltipProvider } from '@/components/primitives/overlays/Tooltip'
import { TaskFormDialogProvider } from '@/components/TaskForm/TaskFormDialogProvider'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  clearGuestStorage,
  migrateGuestTasksToAuth,
} from '@/lib/migrate-guest-tasks'
import { StorageMode } from '@/lib/storage'
import Completed from '@/pages/Completed'
import Home from '@/pages/Home'
import HowToInstall from '@/pages/HowToInstall'
import HowToUse from '@/pages/HowToUse'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'
import Settings from '@/pages/Settings'
import { BannersProvider } from '@/providers/BannersProvider'
import { ExpandedTasksProvider } from '@/providers/ExpandedTasksProvider'
import { GuestModeProvider, useGuestMode } from '@/providers/GuestModeProvider'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { SyncProvider } from '@/providers/SyncProvider'
import { TaskSyncQueueProvider } from '@/providers/TaskSyncQueueProvider'
import { TasksProvider } from '@/providers/TasksProvider'
import { StatusBanner } from './components/appInfo/StatusBanner'
import { WhatsNewDialog } from './components/appInfo/WhatsNewDialog'
import { Routes } from './lib/constants'
import { queryClient } from './lib/query-client'

const Router = () => (
  <div className="flex-1 flex flex-col min-h-0">
    <Switch>
      <Route path={Routes.HOME} component={Home} />
      <Route path={Routes.COMPLETED} component={Completed} />
      <Route path={Routes.SETTINGS} component={Settings} />
      <Route path={Routes.HOW_TO_USE} component={HowToUse} />
      <Route path={Routes.HOW_TO_INSTALL} component={HowToInstall} />
      <Route component={NotFound} />
    </Switch>
  </div>
)

const GuestRedirect = () => {
  const { enterGuestMode } = useGuestMode()
  const [, setLocation] = useLocation()

  useEffect(() => {
    enterGuestMode()
    setLocation(Routes.HOME)
  }, [enterGuestMode, setLocation])

  return null
}

const AuthenticatedApp = () => {
  const { isLoading, isAuthenticated } = useAuth()
  const { isGuestMode } = useGuestMode()
  const { toast } = useToast()
  const hasMigrated = useRef(false)
  const [location] = useLocation()

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
    if (location === Routes.HOW_TO_INSTALL) {
      return <HowToInstall />
    }
    if (location === Routes.GUEST) {
      return <GuestRedirect />
    }
    return <Landing />
  }

  const shouldSync = isAuthenticated && !isGuestMode
  const storageMode = isGuestMode ? StorageMode.GUEST : StorageMode.AUTH

  return (
    <SettingsProvider shouldSync={shouldSync} storageMode={storageMode}>
      <TaskSyncQueueProvider
        key={storageMode} // necessary to reset the queue when switching between guest/auth modes
        shouldSync={shouldSync}
        storageMode={storageMode}
      >
        <TasksProvider shouldSync={shouldSync} storageMode={storageMode}>
          <SyncProvider isAuthenticated={shouldSync}>
            <ExpandedTasksProvider>
              <TaskFormDialogProvider>
                <div className="h-dvh flex flex-col overflow-hidden">
                  <StatusBanner />
                  <Router />
                  <WhatsNewDialog />
                </div>
              </TaskFormDialogProvider>
            </ExpandedTasksProvider>
          </SyncProvider>
        </TasksProvider>
      </TaskSyncQueueProvider>
    </SettingsProvider>
  )
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BannersProvider>
          <GuestModeProvider>
            <Toaster />
            <AuthenticatedApp />
          </GuestModeProvider>
        </BannersProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)

export default App
