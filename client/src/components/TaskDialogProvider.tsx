import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { Task } from "@shared/schema";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

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

  // Prevent scrolling when mobile view is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <TaskDialogContext.Provider value={{ openCreateDialog, openEditDialog, closeDialog }}>
      {children}
      
      {/* Desktop Dialog (Hidden on Mobile) */}
      <div className="hidden sm:block">
        <Dialog open={isOpen && window.innerWidth >= 640} onOpenChange={setIsOpen}>
          <DialogContent 
            className="w-full max-w-[600px] overflow-y-auto bg-card border-white/10 p-6 shadow-2xl rounded-xl"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-display tracking-tight">
                    {mode === 'create' ? (parentId ? 'New Subtask' : 'New Task') : 'Edit Task'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {mode === 'create' ? 'Add a new item to your list.' : 'Update task details and properties.'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="mt-4">
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
      </div>

      {/* Mobile Full-Screen View */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-background sm:hidden flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-16 shrink-0 bg-background/95 backdrop-blur-sm px-4 flex items-center justify-between border-b border-white/10 z-[110] pointer-events-auto">
              <h2 className="text-xl font-bold tracking-tight truncate">
                {mode === 'create' ? (parentId ? 'New Subtask' : 'New Task') : 'Edit Task'}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeDialog();
                }}
                className="h-12 w-12 -mr-2 rounded-full hover:bg-white/10 relative z-[120] flex items-center justify-center text-foreground"
                data-testid="button-close-mobile-view"
              >
                <X className="h-6 w-6 pointer-events-none" />
              </Button>
            </div>
            
            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto px-4 pt-6 pb-20 pointer-events-auto"
            >
              <TaskForm 
                onSubmit={handleSubmit} 
                isPending={isPending} 
                initialData={activeTask}
                parentId={parentId}
                onCancel={closeDialog}
                onAddChild={(pid) => openCreateDialog(pid)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TaskDialogContext.Provider>
  );
}
