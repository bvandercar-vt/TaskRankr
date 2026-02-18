import { Download, Mail } from "lucide-react";

import { debugLog } from "@/lib/debug-logger";
import { useGuestMode } from "@/providers/GuestModeProvider";
import { Button } from "../primitives/Button";
import { InlineLink } from "../primitives/InlineText";

const ContactCardInner = ({
  className,
  showDebugDownload,
  isGuestMode,
}: {
  className?: string;
  showDebugDownload?: boolean;
  isGuestMode: boolean;
}) => (
  <div
    className={`p-3 bg-card rounded-lg border border-white/10 ${className ?? ""}`}
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
        <InlineLink
          href="mailto:taskrankr@gmail.com"
          className="inline-flex items-center gap-1.5 text-sm px-1"
          data-testid="link-contact-email"
        >
          <Mail className="size-4" />
          taskrankr@gmail.com
        </InlineLink>
        {showDebugDownload && (
          <Button
            variant="outline"
            size="sm"
            className="text-[11px] text-muted-foreground/60 gap-1.5 p-0 m-0 py-0 "
            onClick={() => debugLog.download(isGuestMode)}
            data-testid="button-download-debug-logs"
          >
            <Download className="size-3" />
            Download Debug Logs
          </Button>
        )}
      </div>
    </div>
  </div>
);

export const ContactCard = ({
  className,
  showDebugDownload,
}: {
  className?: string;
  showDebugDownload?: boolean;
}) => {
  const { isGuestMode } = useGuestMode();

  return (
    <ContactCardInner
      className={className}
      showDebugDownload={showDebugDownload}
      isGuestMode={isGuestMode}
    />
  );
};

export const ContactCardStandalone = ({
  className,
  showDebugDownload,
  isGuestMode = true,
}: {
  className?: string;
  showDebugDownload?: boolean;
  isGuestMode?: boolean;
}) => (
  <ContactCardInner
    className={className}
    showDebugDownload={showDebugDownload}
    isGuestMode={isGuestMode}
  />
);
