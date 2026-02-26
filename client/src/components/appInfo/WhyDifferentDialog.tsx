import { CheckCircle, ListTodo, Star } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/overlays/Dialog'

export const WhyDifferentDialog = ({
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
              TaskRankr gives you 5, so you can be much more specific about what
              matters most.
            </div>
          </li>

          <li className="flex gap-2">
            <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-foreground">
                Sort by ease, enjoyment, and time.
              </span>{' '}
              No other app has this. You can disable any of these in your
              settings.
              <ul className="mt-1.5 space-y-1.5 ml-1">
                <li className="flex gap-2">
                  <span className="text-emerald-500 shrink-0">•</span>
                  <span>
                    <span className="font-medium text-foreground">Ease or Enjoyment</span>
                    {' '}— You've been grinding through high-priority tasks all
                    day. Now it's evening and you want to stay productive but
                    enjoy yourself — sort by Ease or Enjoyment.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 shrink-0">•</span>
                  <span>
                    <span className="font-medium text-foreground">Time</span>
                    {' '}— You have a free moment and want to knock things out —
                    sort by Time to find quick 10–30 minute tasks.
                  </span>
                </li>
              </ul>
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
            If you find any bugs or have feature suggestions, please email me at{' '}
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
