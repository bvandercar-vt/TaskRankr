import { Download, Mail } from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import { useGuestMode } from '@/components/providers/GuestModeProvider'
import { IconSize } from '@/lib/constants'
import { debugLog } from '@/lib/debug-logger'

export const ContactCard = ({
  className,
  showDebugDownload,
}: {
  className?: string
  showDebugDownload?: boolean
}) => {
  const { isGuestMode } = useGuestMode()

  return (
    <div
      className={`p-4 bg-card rounded-lg border border-white/10 ${className ?? ''}`}
      data-testid="card-contact"
    >
      <h3 className="font-semibold text-foreground">Help & Feedback</h3>
      <p className="text-sm text-muted-foreground">
        Support / Bug Report / Feature Suggestions
      </p>
      <div className="flex flex-col items-center gap-3 mt-3">
        <a
          href="mailto:taskrankr@gmail.com"
          className="inline-flex items-center gap-2 text-sm text-purple-400 hover-elevate rounded-md px-1"
          data-testid="link-contact-email"
        >
          <Mail className={IconSize.HW4} />
          taskrankr@gmail.com
        </a>
        {showDebugDownload && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => debugLog.download(isGuestMode)}
            data-testid="button-download-debug-logs"
          >
            <Download className={IconSize.HW4} />
            Download Debug Logs
          </Button>
        )}
      </div>
    </div>
  )
}
