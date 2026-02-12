import { Download, Mail } from "lucide-react";

import { useGuestMode } from "@/components/providers/GuestModeProvider";
import { debugLog } from "@/lib/debug-logger";

export const ContactCard = ({
  className,
  showDebugDownload,
}: {
  className?: string;
  showDebugDownload?: boolean;
}) => {
  const { isGuestMode } = useGuestMode();

  return (
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
        <div className="flex flex-col items-end gap-1 pt-2">
          <a
            href="mailto:taskrankr@gmail.com"
            className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover-elevate rounded-md px-1"
            data-testid="link-contact-email"
          >
            <Mail className="h-3 w-3" />
            taskrankr@gmail.com
          </a>
          {showDebugDownload && (
            <button
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors px-1"
              onClick={() => debugLog.download(isGuestMode)}
              data-testid="button-download-debug-logs"
            >
              <Download className="h-3 w-3" />
              Download Debug Logs
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
