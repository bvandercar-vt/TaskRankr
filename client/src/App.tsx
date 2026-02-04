import { QueryClientProvider } from '@tanstack/react-query'
import { Route, Switch } from 'wouter'

import { DemoProvider, useDemo } from '@/components/DemoProvider'
import { Button } from '@/components/primitives/button'
import { Toaster } from '@/components/primitives/overlays/toaster'
import { TooltipProvider } from '@/components/primitives/overlays/tooltip'
import { TaskDialogProvider } from '@/components/TaskDialogProvider'
import { useAuth } from '@/hooks/use-auth'
import Completed from '@/pages/Completed'
import Home from '@/pages/Home'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'
import Settings from '@/pages/Settings'
import { queryClient } from './lib/query-client'
import { authPaths } from '~/shared/routes'

const Router = () => (
  <Switch>
    <Route path="/" component={Home} />
    <Route path="/completed" component={Completed} />
    <Route path="/settings" component={Settings} />
    <Route component={NotFound} />
  </Switch>
)

const DemoBanner = () => {
  const { isDemo, exitDemo } = useDemo()

  if (!isDemo) return null

  return (
    <div
      className="sticky top-0 z-50 bg-primary/90 text-primary-foreground px-4 py-2 flex items-center justify-center gap-4 text-sm"
      data-testid="banner-demo-mode"
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
        onClick={exitDemo}
        data-testid="button-banner-exit"
      >
        Exit Demo
      </Button>
    </div>
  )
}

const AuthenticatedApp = () => {
  const { isLoading, isAuthenticated } = useAuth()
  const { isDemo } = useDemo()

  if (isLoading && !isDemo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated && !isDemo) {
    return <Landing />
  }

  return (
    <TaskDialogProvider>
      <DemoBanner />
      <Router />
    </TaskDialogProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DemoProvider>
        <Toaster />
        <AuthenticatedApp />
      </DemoProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
