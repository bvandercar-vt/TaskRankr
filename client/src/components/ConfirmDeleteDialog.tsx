/**
 * @fileoverview Confirmation dialog for permanent task deletion
 */

import { Button } from '@/components/primitives/Button'
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
  onRemoveAsSubtask?: () => void
}

export const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  taskName,
  onConfirm,
  onRemoveAsSubtask,
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
        {onRemoveAsSubtask && (
          <AlertDialogAction asChild>
            <Button
              variant="outline"
              onClick={onRemoveAsSubtask}
              data-testid="button-remove-as-subtask"
            >
              Remove as Subtask
            </Button>
          </AlertDialogAction>
        )}
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
