import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/overlays/dialog'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import type { MutateTaskRequest, Task } from '~/shared/schema'
import { TaskForm, type TaskFormProps } from './TaskForm'

interface TaskDialogContextType {
  openCreateDialog: (parentId?: number) => void
  openEditDialog: (task: Task) => void
  closeDialog: () => void
}

const TaskDialogContext = createContext<TaskDialogContextType | undefined>(
  undefined,
)

export const useTaskDialog = () => {
  const context = useContext(TaskDialogContext)
  if (!context)
    throw new Error('useTaskDialog must be used within a TaskDialogProvider')
  return context
}

interface DialogProps
  extends Pick<TaskFormProps, 'isPending' | 'onSubmit' | 'onAddChild'> {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  mode: 'create' | 'edit'
  parentId?: number
  activeTask?: Task
  onClose: () => void
}

const DesktopDialog = ({
  isOpen,
  setIsOpen,
  mode,
  parentId,
  activeTask,
  isPending,
  onSubmit,
  onClose,
  onAddChild,
}: DialogProps) => (
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
                {mode === 'create'
                  ? parentId
                    ? 'New Subtask'
                    : 'New Task'
                  : 'Edit Task'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {mode === 'create'
                  ? 'Add a new item to your list.'
                  : 'Update task details and properties.'}
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="mt-4">
            <TaskForm
              onSubmit={onSubmit}
              isPending={isPending}
              initialData={activeTask}
              parentId={parentId}
              onCancel={onClose}
              onAddChild={onAddChild}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
)

const MobileDialog = ({
  isOpen,
  activeTask,
  parentId,
  isPending,
  onSubmit,
  onClose,
  onAddChild,
}: Omit<DialogProps, 'setIsOpen' | 'mode'>) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-[100] bg-background sm:hidden flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-4 pt-10">
          <TaskForm
            onSubmit={onSubmit}
            isPending={isPending}
            initialData={activeTask}
            parentId={parentId}
            onCancel={onClose}
            onAddChild={onAddChild}
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

export const TaskDialogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined)
  const [parentId, setParentId] = useState<number | undefined>(undefined)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const openCreateDialog = (pid?: number) => {
    setMode('create')
    setParentId(pid)
    setActiveTask(undefined)
    setIsOpen(true)
  }

  const openEditDialog = (task: Task) => {
    setMode('edit')
    setActiveTask(task)
    setParentId(task.parentId || undefined)
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false)
    setTimeout(() => {
      setActiveTask(undefined)
      setParentId(undefined)
    }, 300)
  }

  const handleSubmit = (data: MutateTaskRequest) => {
    if (mode === 'create') {
      createTask.mutate({ ...data, parentId }, { onSuccess: closeDialog })
    } else if (mode === 'edit' && activeTask) {
      updateTask.mutate(
        { id: activeTask.id, ...data },
        { onSuccess: closeDialog },
      )
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <TaskDialogContext.Provider
      value={{ openCreateDialog, openEditDialog, closeDialog }}
    >
      {children}

      <DesktopDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        mode={mode}
        parentId={parentId}
        activeTask={activeTask}
        isPending={isPending}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onAddChild={openCreateDialog}
      />

      <MobileDialog
        isOpen={isOpen}
        parentId={parentId}
        activeTask={activeTask}
        isPending={isPending}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onAddChild={openCreateDialog}
      />
    </TaskDialogContext.Provider>
  )
}
