import { Download, Mail } from 'lucide-react'

import { useGuestMode } from '@/components/providers/GuestModeProvider'
import { debugLog } from '@/lib/debug-logger'

const ContactCardInner = ({
  className,
  showDebugDownload,
  isGuestMode,
}: {
  className?: string
  showDebugDownload?: boolean
  isGuestMode: boolean
}) => (
  <div
    className={`p-3 bg-card rounded-lg border border-white/10 ${className ?? ''}`}
    data-testid="card-contact"
  >
    <div className="flex items-start justify-between gap-2 flex-wrap">
      <div>
        <h3 className="text-base font-semibold text-foreground pb-1">
          Help & Feedback
        </h3>
        <p className="text-sm text-muted-foreground">
          Support / Bug Report / Feature Suggestions
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 pt-1">
        <a
          href="mailto:taskrankr@gmail.com"
          className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover-elevate rounded-md px-1"
          data-testid="link-contact-email"
        >
          <Mail className="size-3" />
          taskrankr@gmail.com
        </a>
        {showDebugDownload && (
          <button
            type="button"
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors px-1 border border-muted-foreground/20 rounded-md py-0.5"
            onClick={() => debugLog.download(isGuestMode)}
            data-testid="button-download-debug-logs"
          >
            <Download className="size-3" />
            Download Debug Logs
          </button>
        )}
      </div>
    </div>
  </div>
)

export const ContactCard = ({
  className,
  showDebugDownload,
}: {
  className?: string
  showDebugDownload?: boolean
}) => {
  const { isGuestMode } = useGuestMode()

  return (
    <ContactCardInner
      className={className}
      showDebugDownload={showDebugDownload}
      isGuestMode={isGuestMode}
    />
  )
}

export const ContactCardStandalone = ({
  className,
  showDebugDownload,
  isGuestMode = true,
}: {
  className?: string
  showDebugDownload?: boolean
  isGuestMode?: boolean
}) => (
  <ContactCardInner
    className={className}
    showDebugDownload={showDebugDownload}
    isGuestMode={isGuestMode}
  />
)
