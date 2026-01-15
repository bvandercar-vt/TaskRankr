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
      
      {/* Desktop Dialog */}
      <div className="hidden sm:block">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                  <DialogDescription className="text-sm">
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
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-background sm:hidden flex flex-col"
          >
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-50 px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg font-display font-bold tracking-tight truncate leading-tight">
                  {mode === 'create' ? (parentId ? 'New Subtask' : 'New Task') : 'Edit Task'}
                </h2>
                <p className="text-[10px] text-muted-foreground truncate opacity-80">
                  {mode === 'create' ? 'Add a new item to your list.' : 'Update task details and properties.'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeDialog();
                }}
                className="h-10 w-10 rounded-full hover:bg-white/10 shrink-0 relative z-[60] text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 pb-20">
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
