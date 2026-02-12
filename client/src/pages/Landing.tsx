/**
 * @fileoverview Unauthenticated landing page for TaskRankr.
 * Provides login/signup call-to-action for new users.
 */

import { isStandalonePWA } from 'is-standalone-pwa'
import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle,
  Clock,
  Download,
  ListTodo,
  Star,
  WifiOff,
} from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { useGuestMode } from '@/components/providers/GuestModeProvider'
import { Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { authPaths } from '~/shared/constants'

const CaptionedIcon = ({
  icon: Icon,
  color,
  label,
}: {
  icon: LucideIcon
  color: string
  label: string
}) => (
  <div className="flex flex-col items-center gap-2">
    <Icon className={cn('size-6', color)} />
    <span className="text-sm">{label}</span>
  </div>
)

const Landing = () => {
  const { enterGuestMode } = useGuestMode()
  const isStandalone = isStandalonePWA()

  return (
    <div className="max-h-screen bg-background text-foreground flex flex-col">
      <header className="p-6">
        <h1 className="text-xl font-bold" data-testid="text-logo">
          TaskRankr
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold leading-tight pb-2">
          Prioritize your tasks.
        </h2>
        <p className="text-lg text-muted-foreground pb-4">
          Rate and sort by priority, ease, enjoyment, and time for each task.
        </p>

        <div className="flex flex-col items-center gap-6 text-sm text-muted-foreground mb-8">
          <div className="flex justify-center gap-6">
            <CaptionedIcon
              icon={Star}
              color="text-yellow-500"
              label="Priority levels"
            />
            <CaptionedIcon
              icon={CheckCircle}
              color="text-emerald-500"
              label="Ease levels"
            />
          </div>
          <div className="flex justify-center gap-6">
            <CaptionedIcon
              icon={Clock}
              color="text-blue-500"
              label="Time tracking"
            />
            <CaptionedIcon
              icon={ListTodo}
              color="text-amber-500"
              label="Nested tasks"
            />
            <CaptionedIcon
              icon={WifiOff}
              color="text-violet-600"
              label="Works offline"
            />
          </div>
        </div>

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

        {!isStandalone && (
          <div className="mt-8 flex justify-center">
            <Link href={Routes.HOW_TO_INSTALL}>
              <Button
                size="lg"
                className="gap-2 text-lg px-8 min-w-[200px] bg-accent text-accent-foreground border border-accent-border"
                data-testid="button-how-to-install"
              >
                <Download className="size-5" />
                Install as App
              </Button>
            </Link>
          </div>
        )}
      </main>

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
