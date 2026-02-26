import { CheckCircle, ListTodo, Star } from "lucide-react";
import { useLocation } from "wouter";

import { Routes } from "@/lib/constants";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/overlays/Dialog";
import { cn } from "@/lib/utils";

const TEXT_SECTION_STYLE = "text-emerald-300";
const TEXT_PARAGRAPH_LEAD_STYLE = cn(TEXT_SECTION_STYLE, "font-medium");

export const WhyDifferentDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [, setLocation] = useLocation()

  const goToSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenChange(false)
    setLocation(Routes.SETTINGS)
  }

  const settingsLinkClass = "text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"

  return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      data-testid="dialog-why-different"
    >
      <DialogHeader>
        <DialogTitle data-testid="text-why-different-title">
          Why TaskRankr?
        </DialogTitle>
        <DialogDescription className={TEXT_SECTION_STYLE}>
          What makes this app different from the rest.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-sm text-foreground/90 text-left">
        <p>
          Hi, my name is Blake. I have tried over 30 task/to-do list apps, and
          couldn't find a single one that helped me organize my tasks the way I
          wanted. I think this app can help everyone in the same way!
        </p>

        <h3 className={cn(TEXT_SECTION_STYLE, "font-semibold pt-1")}>
          What sets TaskRankr apart:
        </h3>

        <ul className="space-y-4 list-none">
          <li className="flex gap-2">
            <Star className="size-4 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <span className={TEXT_PARAGRAPH_LEAD_STYLE}>
                More priority levels.
              </span>{" "}
              Other apps let you sort by priority, but only have 3 levels.
              TaskRankr gives you 5, so you can be more specific about what
              matters most.
            </div>
          </li>

          <li className="flex gap-2">
            <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className={TEXT_PARAGRAPH_LEAD_STYLE}>
                Sort by ease, enjoyment, and time.
              </span>{" "}
              No other app has this. Here are some examples for why this is
              useful:
              <ul className="my-1.5 space-y-1.5 ml-1">
                <li className="flex gap-2">
                  <span className="text-emerald-500 shrink-0">•</span>
                  <span>
                    <strong>Ease or Enjoyment</strong> — You've been working on
                    high-priority tasks all day. Now it's evening and you want
                    to stay productive but enjoy yourself — sort by{" "}
                    <strong>Enjoyment</strong> for something fun, or{" "}
                    <strong>Ease</strong> to knock out something easy.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 shrink-0">•</span>
                  <span>
                    <strong>Time</strong> — You have a free moment and want to
                    knock things out on your list — sort by{" "}
                    <strong>Time</strong> to find quick 10–30 minute tasks.
                  </span>
                </li>
              </ul>
              And, you can disable any of these in your{" "}
              <a onClick={goToSettings} className={settingsLinkClass}>settings</a>
              {" "}to your needs.
            </div>
          </li>

          <li className="flex gap-2">
            <ListTodo className="size-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className={TEXT_PARAGRAPH_LEAD_STYLE}>
                Jot down ideas without clutter.
              </span>{" "}
              More-specific sorting means you can freely jot down random ideas
              or projects — as "low importance" as they are — without the worry
              of bogging down your list from what is more important.
            </div>
          </li>

          <li className="flex gap-2">
            <ListTodo className="size-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className={TEXT_PARAGRAPH_LEAD_STYLE}>
                Subtask sort order.
              </span>{" "}
              Create subtasks, subtasks of subtasks, and so on. Within each
              level, you can manually sort them as a step-by-step process (and
              optionally display them as auto-numbered). Or, leave a subtask
              level un-ordered, and subtasks will inherit the overall sort order
              of your view (e.g. highest priority/highest ease/etc.). Subtasks
              will be crossed out as you complete them.
            </div>
          </li>
        </ul>

        <div className="border-t border-border pt-4 space-y-3">
          <p>
            I encourage you to give it a shot. Check out{" "}
            <a onClick={goToSettings} className={settingsLinkClass}>Settings</a>
            {" "}to see what you can customize. I built this to help me, and if you're someone
            who can use some organization of their tasks, I think it can help
            you too.
          </p>
          <p className="text-muted-foreground">
            If you find any bugs or have feature suggestions, please email me at{" "}
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
}
