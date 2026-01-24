import { Clock, StopCircle, X } from "lucide-react";
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

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  isInProgress: boolean;
  showRestore: boolean;
  onToggleInProgress: () => void;
  onComplete: () => void;
  onDeleteClick: () => void;
}

export function ChangeStatusDialog({
  open,
  onOpenChange,
  taskName,
  isInProgress,
  showRestore,
  onToggleInProgress,
  onComplete,
  onDeleteClick,
}: ChangeStatusDialogProps) {
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
            {showRestore ? "Restore Task?" : "Task Status"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {showRestore
              ? `Move "${taskName}" back to your active task list.`
              : `Choose an action for "${taskName}"`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col gap-3 w-full">
            {!showRestore && (
              <Button
                onClick={onToggleInProgress}
                variant="outline"
                className={cn(
                  "w-full h-11 text-base font-semibold gap-2",
                  isInProgress
                    ? "border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    : "border-blue-500/50 text-blue-400 hover:bg-blue-500/10",
                )}
                data-testid="button-toggle-in-progress"
              >
                {isInProgress ? (
                  <>
                    <StopCircle className="w-4 h-4" />
                    Remove from Progress
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Mark as In Progress
                  </>
                )}
              </Button>
            )}

            <AlertDialogAction
              onClick={onComplete}
              className={cn(
                "w-full h-11 text-base font-semibold",
                showRestore
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white",
              )}
              data-testid="button-complete-task"
            >
              {showRestore ? "Restore Task" : "Complete Task"}
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
}
