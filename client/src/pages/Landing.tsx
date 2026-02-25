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
  Info,
  ListTodo,
  Star,
  WifiOff,
} from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/primitives/overlays/Dialog'
import { useState } from 'react'
import { Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useGuestMode } from '@/providers/GuestModeProvider'
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

const WhyDifferentDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      data-testid="dialog-why-different"
    >
      <DialogHeader>
        <DialogTitle data-testid="text-why-different-title">
          Why TaskRankr?
        </DialogTitle>
        <DialogDescription>
          What makes this app different from the rest.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-sm text-foreground/90 text-left">
        <p>
          Hi, my name is Blake and I have tried over 30 task/to-do apps, and
          couldn't find a single one that helped me organize my tasks the way I
          wanted. I hope this app helps you too.
        </p>

        <h3 className="font-semibold text-foreground pt-1">
          What sets TaskRankr apart:
        </h3>

        <ul className="space-y-4 list-none">
          <li className="flex gap-2">
            <Star className="size-4 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-foreground">
                More priority levels.
              </span>{' '}
              Other apps let you sort by priority, but they only have 3 levels.
              TaskRankr gives you 5, so you can be much more specific about
              what matters most.
            </div>
          </li>

          <li className="flex gap-2">
            <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-foreground">
                Sort by ease, enjoyment, and time.
              </span>{' '}
              No other app has this. You've been grinding through high-priority
              tasks all day. Now it's evening and you want to stay productive
              but enjoy yourself — sort by Ease or Enjoyment. Or you have a
              free moment and want to knock things out — sort by Time to find
              quick 10–30 minute tasks. You can disable any of these in your
              settings.
            </div>
          </li>

          <li className="flex gap-2">
            <ListTodo className="size-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-foreground">
                Jot down ideas without clutter.
              </span>{' '}
              More specific sorting means you can freely jot down random ideas
              or projects — set priority to lowest, enjoyment to high, etc.
              You'll still find what's important when you need to, and discover
              that fun idea when you're looking for something enjoyable.
            </div>
          </li>

          <li className="flex gap-2">
            <ListTodo className="size-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-foreground">
                Subtask sort order.
              </span>{' '}
              Create subtasks, subtasks of subtasks, and so on. Within each
              level, you can manually sort them as a step-by-step process and
              optionally display auto-numbered steps — they'll be crossed out as
              you complete them. Or leave a level un-ordered, and subtasks will
              inherit the overall sort order of your view (e.g. highest priority
              first).
            </div>
          </li>
        </ul>

        <div className="border-t border-border pt-4 space-y-3">
          <p>
            I encourage you to give it a shot. Check out Settings to see what
            you can customize. I built this to help me, and I hope it can help
            you.
          </p>
          <p className="text-muted-foreground">
            If you find any bugs or have feature suggestions, please email me
            at{' '}
            <a
              href="mailto:taskrankr@gmail.com"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              data-testid="link-why-different-email"
            >
              taskrankr@gmail.com
            </a>
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

const Landing = () => {
  const { enterGuestMode } = useGuestMode()
  const isStandalone = isStandalonePWA()
  const [showWhyDialog, setShowWhyDialog] = useState(false)

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

        <button
          onClick={() => setShowWhyDialog(true)}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          data-testid="button-why-different"
        >
          <Info className="size-4" />
          What makes this app different?
        </button>

        {!isStandalone && (
          <div className="mt-6 flex justify-center">
            <Button
              href={Routes.HOW_TO_INSTALL}
              size="lg"
              className="gap-2 text-lg px-8 min-w-[200px] bg-accent text-accent-foreground border border-accent-border"
              data-testid="button-how-to-install"
            >
              <Download className="size-5" />
              Install as App
            </Button>
          </div>
        )}
      </main>

      <footer
        className="p-6 text-center text-sm text-muted-foreground"
        data-testid="footer"
      >
        <p data-testid="text-footer-brand">TaskRankr</p>
      </footer>

      <WhyDifferentDialog
        open={showWhyDialog}
        onOpenChange={setShowWhyDialog}
      />
    </div>
  )
}

export default Landing
