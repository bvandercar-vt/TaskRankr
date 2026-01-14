import { createContext, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { Task } from "@shared/schema";

interface TaskDialogContextType {
  openCreateDialog: (parentId?: number) => void;
  openEditDialog: (task: Task) => void;
  closeDialog: () => void;
}

const TaskDialogContext = createContext<TaskDialogContextType | undefined>(undefined);

export function useTaskDialog() {
  const context = useContext(TaskDialogContext);
  if (!context) throw new Error("useTaskDialog must be used within a TaskDialogProvider");
  return context;
}

export function TaskDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);
  const [parentId, setParentId] = useState<number | undefined>(undefined);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const openCreateDialog = (pid?: number) => {
    setMode('create');
    setParentId(pid);
    setActiveTask(undefined);
    setIsOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setMode('edit');
    setActiveTask(task);
    setParentId(task.parentId || undefined);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setTimeout(() => {
      setActiveTask(undefined);
      setParentId(undefined);
    }, 300); // Wait for animation
  };

  const handleSubmit = (data: any) => {
    if (mode === 'create') {
      createTask.mutate({ ...data, parentId }, {
        onSuccess: closeDialog
      });
    } else if (mode === 'edit' && activeTask) {
      updateTask.mutate({ id: activeTask.id, ...data }, {
        onSuccess: closeDialog
      });
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <TaskDialogContext.Provider value={{ openCreateDialog, openEditDialog, closeDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] h-[90vh] sm:h-auto overflow-y-auto bg-card border-white/10 p-4 sm:p-6 shadow-2xl rounded-t-xl sm:rounded-xl bottom-0 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
          <DialogHeader className="sticky top-0 bg-card pb-4 z-10">
            <DialogTitle className="text-2xl font-display tracking-tight">
              {mode === 'create' ? (parentId ? 'New Subtask' : 'New Task') : 'Edit Task'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' ? 'Add a new item to your list.' : 'Update task details and properties.'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            onSubmit={handleSubmit} 
            isPending={isPending} 
            initialData={activeTask}
            parentId={parentId}
            onCancel={closeDialog}
            onAddChild={(pid) => openCreateDialog(pid)}
          />
        </DialogContent>
      </Dialog>
    </TaskDialogContext.Provider>
  );
}
