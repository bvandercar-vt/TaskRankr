import { Clock, StopCircle, X, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/primitives/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/primitives/overlays/alert-dialog";
import type { TaskStatus } from "@shared/schema";

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  status: TaskStatus;
  onSetStatus: (status: TaskStatus) => void;
  onDeleteClick: () => void;
}

export const ChangeStatusDialog = ({
  open,
  onOpenChange,
  taskName,
  status,
  onSetStatus,
  onDeleteClick,
}: ChangeStatusDialogProps) => {
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  const isPinned = status === "pinned";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-white/10 pt-10">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
          data-testid="button-close-status-dialog"
        >
          <X className="w-4 h-4" />
        </Button>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCompleted ? "Restore Task?" : "Task Status"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCompleted
              ? `Move "${taskName}" back to your active task list.`
              : `Choose an action for "${taskName}"`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col gap-3 w-full">
            {!isCompleted && (
              <>
                {/* Start/Stop Working button */}
                {isInProgress ? (
                  <Button
                    onClick={() => onSetStatus("open")}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-slate-400/50 text-slate-400 hover:bg-slate-500/10"
                    data-testid="button-stop-progress"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Working
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSetStatus("in_progress")}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    data-testid="button-start-progress"
                  >
                    <Clock className="w-4 h-4" />
                    Start Working
                  </Button>
                )}

                {/* Pin/Unpin button */}
                {isInProgress || isPinned ? (
                  <Button
                    onClick={() => onSetStatus("open")}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-slate-400/50 text-slate-400 hover:bg-slate-500/10"
                    data-testid="button-unpin"
                  >
                    <PinOff className="w-4 h-4" />
                    Unpin
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSetStatus("pinned")}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-slate-400/50 text-slate-400 hover:bg-slate-500/10"
                    data-testid="button-pin"
                  >
                    <Pin className="w-4 h-4" />
                    Pin to Top
                  </Button>
                )}
              </>
            )}

            <AlertDialogAction
              onClick={() => onSetStatus(isCompleted ? "open" : "completed")}
              className={cn(
                "w-full h-11 text-base font-semibold",
                isCompleted
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white",
              )}
              data-testid="button-complete-task"
            >
              {isCompleted ? "Restore Task" : "Complete Task"}
            </AlertDialogAction>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-8"
                onClick={onDeleteClick}
                data-testid="button-delete-task"
              >
                <span className="text-xs font-medium">Delete Permanently</span>
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
