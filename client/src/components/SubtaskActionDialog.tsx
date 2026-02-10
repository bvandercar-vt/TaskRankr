/**
 * @fileoverview Action dialog for subtask deletion — offers Cancel, Delete, or Remove as Subtask
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/primitives/overlays/AlertDialog'

interface SubtaskActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskName: string
  onDelete: () => void
  onRemoveAsSubtask: () => void
}

export const SubtaskActionDialog = ({
  open,
  onOpenChange,
  taskName,
  onDelete,
  onRemoveAsSubtask,
}: SubtaskActionDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-card border-white/10">
      <AlertDialogHeader>
        <AlertDialogTitle>What would you like to do?</AlertDialogTitle>
        <AlertDialogDescription>
          "{taskName}" is a subtask. You can remove it from its parent without
          deleting it, or delete it permanently.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <AlertDialogCancel className="bg-secondary/50 border-white/5 hover:bg-white/10">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onDelete}
          className="bg-destructive hover:bg-destructive/90 text-white"
          data-testid="button-subtask-delete"
        >
          Delete
        </AlertDialogAction>
        <AlertDialogAction
          onClick={onRemoveAsSubtask}
          className="bg-secondary/80 hover:bg-secondary text-foreground"
          data-testid="button-remove-as-subtask"
        >
          Remove as Subtask
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
