/**
 * @fileoverview Confirmation dialog for permanent task deletion
 */

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/primitives/overlays/AlertDialog'
import { cn } from '@/lib/utils'

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
    <AlertDialogPortal>
      <AlertDialogOverlay className="z-[110]" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-[50%] top-[50%] z-[110] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          'bg-card border-white/10',
        )}
      >
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
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  </AlertDialog>
)
