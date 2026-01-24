import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/primitives/overlays/alert-dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  onConfirm: () => void;
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
      <AlertDialogFooter>
        <AlertDialogCancel className="bg-secondary/50 border-white/5 hover:bg-white/10">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive hover:bg-destructive/90 text-white"
        >
          Delete Permanently
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
