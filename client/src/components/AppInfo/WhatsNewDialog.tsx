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

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const ChangelogEntryList = ({ entries }: { entries: ChangelogEntry[] }) => (
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
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              {change}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)

const ChangelogShell = ({
  open,
  onOpenChange,
  title,
  entries,
  buttonLabel,
  buttonVariant = 'default',
  testIdPrefix,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  entries: ChangelogEntry[]
  buttonLabel: string
  buttonVariant?: 'default' | 'outline'
  testIdPrefix: string
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-w-md max-h-[80vh] overflow-y-auto"
      data-testid={`dialog-${testIdPrefix}`}
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          {title}
        </DialogTitle>
      </DialogHeader>

      <ChangelogEntryList entries={entries} />

      <DialogFooter>
        <Button
          onClick={() => onOpenChange(false)}
          variant={buttonVariant}
          className="w-full"
          data-testid={`button-${testIdPrefix}-dismiss`}
        >
          {buttonLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

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

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setLastSeenVersion(APP_VERSION)
      setOpen(false)
    }
  }

  if (entries.length === 0) return null

  return (
    <ChangelogShell
      open={open}
      onOpenChange={handleClose}
      title="What's New"
      entries={entries}
      buttonLabel="Got it"
      testIdPrefix="whats-new"
    />
  )
}

export const ChangelogDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => (
  <ChangelogShell
    open={open}
    onOpenChange={onOpenChange}
    title="Changelog"
    entries={changelog}
    buttonLabel="Close"
    buttonVariant="outline"
    testIdPrefix="changelog"
  />
)
