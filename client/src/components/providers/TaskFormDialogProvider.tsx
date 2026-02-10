/**
 * @fileoverview Context provider for task create/edit dialog with
 * desktop/mobile variants.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/overlays/Dialog";
import { TaskForm, type TaskFormProps } from "@/components/TaskForm";
import { useTaskActions } from "@/hooks/useTasks";
import type { CreateTask, Task } from "~/shared/schema";
import type { DeleteTaskArgs, MutateTaskContent } from "./LocalStateProvider";

interface TaskFormDialogContextType {
  openCreateDialog: (parentId?: number) => void;
  openEditDialog: (task: Task) => void;
  closeDialog: () => void;
}

const TaskFormDialogContext = createContext<
  TaskFormDialogContextType | undefined
>(undefined);

export const useTaskDialog = () => {
  const context = useContext(TaskFormDialogContext);
  if (!context)
    throw new Error("useTaskDialog must be used within a TaskDialogProvider");
  return context;
};

interface TaskFormDialogProps
  extends Pick<
    TaskFormProps,
    "onSubmit" | "onAddChild" | "onEditChild" | "onSubtaskDelete"
  > {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mode: "create" | "edit";
  parentId?: number;
  activeTask?: Task;
  onClose: () => void;
}

const DesktopDialog = ({
  isOpen,
  setIsOpen,
  mode,
  parentId,
  activeTask,
  onSubmit,
  onClose,
  onAddChild,
  onEditChild,
  onSubtaskDelete,
}: TaskFormDialogProps) => (
  <div className="hidden sm:block">
    <Dialog open={isOpen && window.innerWidth >= 640} onOpenChange={setIsOpen}>
      <DialogContent
        className="w-full max-w-[600px] max-h-[calc(100vh-2.5rem)] overflow-y-auto bg-card border-white/10 p-6 shadow-2xl rounded-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <div className="flex-1">
            <DialogTitle>
              {mode === "create"
                ? parentId
                  ? "New Subtask"
                  : "New Task"
                : "Edit Task"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a new item to your list."
                : "Update task details and properties."}
            </DialogDescription>
          </div>
        </DialogHeader>
        <TaskForm
          key={activeTask?.id ?? `new-${parentId ?? "root"}`}
          onSubmit={onSubmit}
          initialData={activeTask}
          parentId={parentId}
          onCancel={onClose}
          onAddChild={onAddChild}
          onEditChild={onEditChild}
          onSubtaskDelete={onSubtaskDelete}
        />
      </DialogContent>
    </Dialog>
  </div>
);

const MobileDialog = ({
  isOpen,
  activeTask,
  parentId,
  onSubmit,
  onClose,
  onAddChild,
  onEditChild,
  onSubtaskDelete,
}: Omit<TaskFormDialogProps, "setIsOpen" | "mode">) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-[100] bg-background sm:hidden flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4">
          <TaskForm
            key={activeTask?.id ?? `new-${parentId ?? "root"}`}
            onSubmit={onSubmit}
            initialData={activeTask}
            parentId={parentId}
            onCancel={onClose}
            onAddChild={onAddChild}
            onEditChild={onEditChild}
            onSubtaskDelete={onSubtaskDelete}
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const TaskFormDialogProvider = ({
  children,
  // biome-ignore lint/complexity/noBannedTypes: is fine
}: React.PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);
  const [parentId, setParentId] = useState<number | undefined>(undefined);
  const [returnToTask, setReturnToTask] = useState<Task | undefined>(undefined);

  const [subtaskToDelete, setSubtaskToDelete] = useState<DeleteTaskArgs | null>(
    null,
  );

  const { createTask, updateTask, deleteTask } = useTaskActions();

  const openCreateDialog = (pid?: number) => {
    if (mode === "edit" && activeTask && pid !== undefined) {
      setReturnToTask(activeTask);
    }
    setMode("create");
    setParentId(pid);
    setActiveTask(undefined);
    setIsOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setMode("edit");
    setActiveTask(task);
    setParentId(task.parentId ?? undefined);
    setReturnToTask(undefined);
    setIsOpen(true);
  };

  const handleEditChild = (task: Task) => {
    if (activeTask) {
      setReturnToTask(activeTask);
    }
    setMode("edit");
    setActiveTask(task);
    setParentId(task.parentId ?? undefined);
    setIsOpen(true);
  };

  const closeDialog = () => {
    if (returnToTask) {
      const taskToReturn = returnToTask;
      setReturnToTask(undefined);
      setMode("edit");
      setActiveTask(taskToReturn);
      setParentId(taskToReturn.parentId ?? undefined);
    } else {
      setIsOpen(false);
      setTimeout(() => {
        setActiveTask(undefined);
        setParentId(undefined);
      }, 300);
    }
  };

  const handleSubmit = (data: MutateTaskContent) => {
    if (mode === "create") {
      createTask({ ...data, parentId } as CreateTask);
      closeDialog();
    } else if (mode === "edit" && activeTask) {
      updateTask({ id: activeTask.id, ...data });
      closeDialog();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <TaskFormDialogContext.Provider
      value={{ openCreateDialog, openEditDialog, closeDialog }}
    >
      {children}

      <DesktopDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        mode={mode}
        parentId={parentId}
        activeTask={activeTask}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onAddChild={openCreateDialog}
        onEditChild={handleEditChild}
        onSubtaskDelete={setSubtaskToDelete}
      />

      <MobileDialog
        isOpen={isOpen}
        parentId={parentId}
        activeTask={activeTask}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onAddChild={openCreateDialog}
        onEditChild={handleEditChild}
        onSubtaskDelete={setSubtaskToDelete}
      />

      <ConfirmDeleteDialog
        open={!!subtaskToDelete}
        onOpenChange={(open) => !open && setSubtaskToDelete(null)}
        taskName={subtaskToDelete?.name ?? ""}
        onConfirm={() => {
          if (subtaskToDelete) {
            deleteTask(subtaskToDelete.id);
            setSubtaskToDelete(null);
          }
        }}
      />
    </TaskFormDialogContext.Provider>
  );
};
