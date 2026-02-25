import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/overlays/Dialog'
import {
  APP_VERSION,
  type ChangelogEntry,
  changelog,
  getUnseenEntries,
  hasUnseenChanges,
  setLastSeenVersion,
} from '@/lib/changelog'

export const WhatsNewDialog = () => {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ChangelogEntry[]>([])

  useEffect(() => {
    if (hasUnseenChanges()) {
      const unseen = getUnseenEntries()
      if (unseen.length > 0) {
        setEntries(unseen)
        setOpen(true)
      } else {
        setLastSeenVersion(APP_VERSION)
      }
    }
  }, [])

  const handleClose = () => {
    setLastSeenVersion(APP_VERSION)
    setOpen(false)
  }

  if (entries.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md max-h-[80vh] overflow-y-auto"
        data-testid="dialog-whats-new"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            What's New
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {entries.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">
                  v{entry.version}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.date)}
                </span>
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1.5">
                {entry.title}
              </h3>
              <ul className="space-y-1">
                {entry.changes.map((change, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={handleClose}
            className="w-full"
            data-testid="button-whats-new-dismiss"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const WhatsNewButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="p-4 bg-card rounded-lg border border-white/10 flex items-center justify-between hover-elevate cursor-pointer w-full text-left"
    data-testid="button-view-changelog"
  >
    <div>
      <h3 className="font-semibold text-foreground">What's New</h3>
      <p className="text-sm text-muted-foreground">
        See recent updates and changes
      </p>
    </div>
    <Sparkles className="size-5 text-muted-foreground shrink-0" />
  </button>
)

export const ChangelogDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-w-md max-h-[80vh] overflow-y-auto"
      data-testid="dialog-changelog"
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Changelog
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-2">
        {changelog.map((entry) => (
          <div key={entry.version}>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold text-foreground">
                v{entry.version}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(entry.date)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1.5">
              {entry.title}
            </h3>
            <ul className="space-y-1">
              {entry.changes.map((change, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex gap-2"
                >
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button
          onClick={() => onOpenChange(false)}
          variant="outline"
          className="w-full"
          data-testid="button-changelog-close"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
