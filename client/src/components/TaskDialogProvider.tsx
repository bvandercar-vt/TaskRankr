import { createContext, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { Task } from "@shared/schema";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <DialogContent 
          className="w-full h-full max-w-none sm:max-w-[600px] sm:h-auto overflow-y-auto bg-card border-white/10 p-0 sm:p-6 shadow-2xl sm:rounded-xl inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col h-full sm:h-auto">
            <DialogHeader className="sticky top-0 bg-card p-4 sm:p-0 border-b border-white/5 sm:border-0 z-10 flex flex-row items-center justify-between space-y-0">
              <div className="flex-1">
                <DialogTitle className="text-xl sm:text-2xl font-display tracking-tight">
                  {mode === 'create' ? (parentId ? 'New Subtask' : 'New Task') : 'Edit Task'}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {mode === 'create' ? 'Add a new item to your list.' : 'Update task details and properties.'}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full sm:hidden">
                  <X className="h-6 w-6" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <div className="flex-1 p-4 sm:p-0">
              <TaskForm 
                onSubmit={handleSubmit} 
                isPending={isPending} 
                initialData={activeTask}
                parentId={parentId}
                onCancel={closeDialog}
                onAddChild={(pid) => openCreateDialog(pid)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TaskDialogContext.Provider>
  );
}
