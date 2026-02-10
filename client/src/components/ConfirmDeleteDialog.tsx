/**
 * @fileoverview Confirmation dialog for permanent task deletion
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

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskName: string
  onConfirm: () => void
}

export const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  taskName,
  onConfirm,
}: ConfirmDeleteDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-card border-white/10">
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Task Permanently?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete "{taskName}" and all its subtasks. This
          action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <AlertDialogCancel className="bg-secondary/50 border-white/5 hover:bg-white/10">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive hover:bg-destructive/90 text-white"
          data-testid="button-delete-permanently"
        >
          Delete Permanently
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

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
