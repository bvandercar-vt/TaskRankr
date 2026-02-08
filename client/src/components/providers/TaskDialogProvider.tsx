/**
 * @fileoverview Context provider for task create/edit dialog with
 * desktop/mobile variants.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/overlays/Dialog'
import {
  type MutateTaskArgs,
  TaskForm,
  type TaskFormProps,
} from '@/components/TaskForm'
import { useCreateTask, useDeleteTask, useUpdateTask } from '@/hooks/useTasks'
import type { CreateTask, Task } from '~/shared/schema'

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
  extends Pick<
    TaskFormProps,
    'isPending' | 'onSubmit' | 'onAddChild' | 'onEditChild' | 'onSubtaskDelete'
  > {
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
  onEditChild,
  onSubtaskDelete,
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
              onEditChild={onEditChild}
              onSubtaskDelete={onSubtaskDelete}
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
  onEditChild,
  onSubtaskDelete,
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
            onEditChild={onEditChild}
            onSubtaskDelete={onSubtaskDelete}
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

export const TaskDialogProvider = ({
  children,
  // biome-ignore lint/complexity/noBannedTypes: is fine
}: React.PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined)
  const [parentId, setParentId] = useState<number | undefined>(undefined)
  const [returnToTask, setReturnToTask] = useState<Task | undefined>(undefined)

  const [subtaskToDelete, setSubtaskToDelete] = useState<{
    id: number
    name: string
  } | null>(null)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const openCreateDialog = (pid?: number) => {
    if (mode === 'edit' && activeTask && pid !== undefined) {
      setReturnToTask(activeTask)
    }
    setMode('create')
    setParentId(pid)
    setActiveTask(undefined)
    setIsOpen(true)
  }

  const openEditDialog = (task: Task) => {
    setMode('edit')
    setActiveTask(task)
    setParentId(task.parentId ?? undefined)
    setReturnToTask(undefined)
    setIsOpen(true)
  }

  const handleEditChild = (task: Task) => {
    if (activeTask) {
      setReturnToTask(activeTask)
    }
    setMode('edit')
    setActiveTask(task)
    setParentId(task.parentId ?? undefined)
    setIsOpen(true)
  }

  const closeDialog = () => {
    if (returnToTask) {
      const taskToReturn = returnToTask
      setReturnToTask(undefined)
      setMode('edit')
      setActiveTask(taskToReturn)
      setParentId(taskToReturn.parentId ?? undefined)
    } else {
      setIsOpen(false)
      setTimeout(() => {
        setActiveTask(undefined)
        setParentId(undefined)
      }, 300)
    }
  }

  const handleSubmit = (data: MutateTaskArgs) => {
    if (mode === 'create') {
      createTask.mutate({ ...data, parentId } as CreateTask, {
        onSuccess: closeDialog,
      })
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
        onEditChild={handleEditChild}
        onSubtaskDelete={setSubtaskToDelete}
      />

      <MobileDialog
        isOpen={isOpen}
        parentId={parentId}
        activeTask={activeTask}
        isPending={isPending}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onAddChild={openCreateDialog}
        onEditChild={handleEditChild}
        onSubtaskDelete={setSubtaskToDelete}
      />

      <ConfirmDeleteDialog
        open={!!subtaskToDelete}
        onOpenChange={(open) => !open && setSubtaskToDelete(null)}
        taskName={subtaskToDelete?.name ?? ''}
        onConfirm={() => {
          if (subtaskToDelete) {
            deleteTask.mutate(subtaskToDelete.id)
            setSubtaskToDelete(null)
          }
        }}
      />
    </TaskDialogContext.Provider>
  )
}
