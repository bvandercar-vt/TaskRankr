/**
 * @fileoverview Unauthenticated landing page for TaskRankr.
 * Provides login/signup call-to-action for new users.
 */

import { CheckCircle, Clock, ListTodo, Star } from 'lucide-react'

import { Button } from '@/components/primitives/button'
import { IconSizeStyle } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { authPaths } from '~/shared/constants'

const Landing = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <header className="p-6 flex justify-between items-center">
      <h1 className="text-xl font-bold" data-testid="text-logo">
        TaskRankr
      </h1>
      <a href={authPaths.login}>
        <Button data-testid="button-login-header">Log In</Button>
      </a>
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
        <a href={authPaths.login} className="mt-4 inline-block">
          <Button
            size="lg"
            className="text-lg px-8"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </a>
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Star className={cn(IconSizeStyle.medium, 'text-primary')} />
          <span>Priority levels</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CheckCircle
            className={cn(IconSizeStyle.medium, 'text-emerald-500')}
          />
          <span>Easy tracking</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Clock className={cn(IconSizeStyle.medium, 'text-blue-500')} />
          <span>Time tracking</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ListTodo className={cn(IconSizeStyle.medium, 'text-amber-500')} />
          <span>Nested tasks</span>
        </div>
      </div>
    </main>

    <footer
      className="p-6 text-center text-sm text-muted-foreground"
      data-testid="footer"
    >
      <p data-testid="text-footer-brand">TaskRankr</p>
    </footer>
  </div>
)

export default Landing
