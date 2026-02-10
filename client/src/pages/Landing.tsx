/**
 * @fileoverview Unauthenticated landing page for TaskRankr.
 * Provides login/signup call-to-action for new users.
 */

import { CheckCircle, Clock, Download, ListTodo, Star } from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { useGuestMode } from '@/components/providers/GuestModeProvider'
import { useIsStandalone } from '@/hooks/useIsStandalone'
import { IconSize, Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { authPaths } from '~/shared/constants'

const Landing = () => {
  const { enterGuestMode } = useGuestMode()
  const isStandalone = useIsStandalone()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-6">
        <h1 className="text-xl font-bold" data-testid="text-logo">
          TaskRankr
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Track tasks with clarity
          </h2>
          <p className="text-lg text-muted-foreground">
            Rate priority, ease, enjoyment, and time for each task. Sort by any
            attribute at a glance.
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={authPaths.login}>
                <Button
                  size="lg"
                  className="text-lg px-8 min-w-[200px]"
                  data-testid="button-get-started"
                >
                  Log In / Sign Up*
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 min-w-[200px]"
                data-testid="button-try-guest"
                onClick={enterGuestMode}
              >
                Try as Guest
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              <sup>*</sup>Log in to back up your data and sync across devices.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Star className={cn(IconSize.HW6, 'text-primary')} />
            <span>Priority levels</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className={cn(IconSize.HW6, 'text-emerald-500')} />
            <span>Easy tracking</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Clock className={cn(IconSize.HW6, 'text-blue-500')} />
            <span>Time tracking</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ListTodo className={cn(IconSize.HW6, 'text-amber-500')} />
            <span>Nested tasks</span>
          </div>
        </div>
      </main>

      {!isStandalone && (
        <div className="flex justify-center px-6 pb-4">
          <Link href={Routes.HOW_TO_INSTALL}>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-lg px-8 min-w-[200px]"
              data-testid="button-how-to-install"
            >
              <Download className={IconSize.HW5} />
              Install as App
            </Button>
          </Link>
        </div>
      )}

      <footer
        className="p-6 text-center text-sm text-muted-foreground"
        data-testid="footer"
      >
        <p data-testid="text-footer-brand">TaskRankr</p>
      </footer>
    </div>
  )
}

export default Landing
