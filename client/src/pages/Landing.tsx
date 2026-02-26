/**
 * @fileoverview Unauthenticated landing page for TaskRankr.
 * Provides login/signup call-to-action for new users.
 */

import { useState } from "react";
import { isStandalonePWA } from "is-standalone-pwa";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle,
  Clock,
  Download,
  Info,
  ListTodo,
  Star,
  WifiOff,
} from "lucide-react";

import { WhyDifferentDialog } from "@/components/appInfo/WhyDifferentDialog";
import { Button } from "@/components/primitives/Button";
import { InitializeButton } from "@/components/primitives/InitializeButton";
import { InlineLink } from "@/components/primitives/InlineText";
import { Routes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useGuestMode } from "@/providers/GuestModeProvider";
import { authPaths } from "~/shared/constants";

const CaptionedIcon = ({
  icon: Icon,
  color,
  label,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-2">
    <Icon className={cn("size-6", color)} />
    <span className="text-sm">{label}</span>
  </div>
);

const Landing = () => {
  const { enterGuestMode } = useGuestMode();
  const isStandalone = isStandalonePWA();
  const [showWhyDialog, setShowWhyDialog] = useState(false);

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

        <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground mb-4">
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
            <CaptionedIcon
              icon={Clock}
              color="text-blue-500"
              label="Time tracking"
            />
          </div>
          <div className="flex justify-center gap-6">
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

        <InlineLink
          onClick={() => setShowWhyDialog(true)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm"
          data-testid="button-why-different"
        >
          <Info className="size-4" />
          What makes this app different, and how it can help you.
        </InlineLink>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
          <InitializeButton
            title="Log In / Sign Up"
            caption="To back up your data and sync across devices"
            href={authPaths.login}
            data-testid="button-get-started"
          />
          <InitializeButton
            title="Try as Guest"
            caption="No signup required"
            variant="outline"
            onClick={enterGuestMode}
            data-testid="button-try-guest"
          />
        </div>

        {!isStandalone && (
          <div className="mt-auto py-8 flex justify-center">
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

      <WhyDifferentDialog
        open={showWhyDialog}
        onOpenChange={setShowWhyDialog}
      />
    </div>
  );
};

export default Landing;
