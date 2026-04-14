import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../primitives/overlays/AlertDialog'

interface TaskFormCancelConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subtaskCount: number
  onDiscard: () => void
}

export const TaskFormCancelConfirmDialog = ({
  open,
  onOpenChange,
  subtaskCount,
  onDiscard,
}: TaskFormCancelConfirmDialogProps) => (
  <AlertDialog
    open={open}
    onOpenChange={onOpenChange}
    data-testid="cancel-confirm-dialog"
  >
    <AlertDialogContent className="bg-card border-white/10">
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
        <AlertDialogDescription>
          You have created {subtaskCount}{' '}
          {subtaskCount === 1 ? 'subtask' : 'subtasks'}.{' '}
          {subtaskCount === 1 ? 'It' : 'They'} will not be created if you cancel
          this parent task.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <AlertDialogCancel
          className="bg-secondary/50 border-white/5 hover:bg-white/10"
          data-testid="button-cancel-deny"
        >
          Go Back
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onDiscard}
          className="bg-destructive hover:bg-destructive/90 text-white"
          data-testid="button-cancel-confirm"
        >
          Cancel and Discard Subtasks
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
