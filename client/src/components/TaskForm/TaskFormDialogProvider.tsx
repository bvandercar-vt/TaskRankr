/**
 * @fileoverview Context provider for task create/edit dialog with
 * desktop/mobile variants.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useIsMobile } from '@/hooks/useMobile'
import { useTaskActions } from '@/hooks/useTasks'
import type {
  DeleteTaskArgs,
  MutateTaskContent,
} from '@/providers/LocalStateProvider'
import { useLocalState } from '@/providers/LocalStateProvider'
import type { CreateTask, Task } from '~/shared/schema'
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../primitives/overlays/Dialog'
import { AssignSubtaskDialog } from '../TaskForm/SubtasksCard/AssignSubtaskDialog'
import { SubtaskActionDialog } from '../TaskForm/SubtasksCard/SubtaskActionDialog'
import { TaskForm, type TaskFormProps } from '../TaskForm/TaskForm'

interface TaskFormDialogContextType {
  openCreateDialog: (parentId?: number) => void
  openEditDialog: (task: Task) => void
  closeDialog: () => void
}

const TaskFormDialogContext = createContext<
  TaskFormDialogContextType | undefined
>(undefined)

export const useTaskDialog = () => {
  const context = useContext(TaskFormDialogContext)
  if (!context)
    throw new Error('useTaskDialog must be used within a TaskDialogProvider')
  return context
}

interface TaskFormDialogProps
  extends Pick<
    TaskFormProps,
    | 'onSubmit'
    | 'onAddSubtask'
    | 'onEditSubtask'
    | 'onDeleteSubtask'
    | 'onAssignSubtask'
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
  onClose,
  ...taskFormArgs
}: TaskFormDialogProps) => (
  <div data-testid="task-form-dialog-desktop">
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="w-full max-w-[600px] max-h-[calc(100vh-2.5rem)] overflow-hidden bg-card border-white/10 p-6 shadow-2xl rounded-xl flex flex-col [&>form]:min-h-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
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
        <TaskForm
          {...taskFormArgs}
          key={activeTask?.id ?? `new-${parentId ?? 'root'}`}
          initialData={activeTask}
          parentId={parentId}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  </div>
)

const MobileDialog = ({
  isOpen,
  activeTask,
  parentId,
  onClose,
  ...taskFormArgs
}: Omit<TaskFormDialogProps, 'setIsOpen' | 'mode'>) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden"
        data-testid="task-form-dialog-mobile"
      >
        <TaskForm
          {...taskFormArgs}
          key={activeTask?.id ?? `new-${parentId ?? 'root'}`}
          initialData={activeTask}
          parentId={parentId}
          onCancel={onClose}
        />
      </motion.div>
    )}
  </AnimatePresence>
)

export const TaskFormDialogProvider = ({
  children,
  // biome-ignore lint/complexity/noBannedTypes: is fine
}: React.PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined)
  const [parentId, setParentId] = useState<number | undefined>(undefined)
  const [returnToTaskStack, setReturnToTaskStack] = useState<Task[]>([])

  const [subtaskToDelete, setSubtaskToDelete] = useState<DeleteTaskArgs | null>(
    null,
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [assignParentTask, setAssignParentTask] = useState<Task | null>(null)

  const { createTask, updateTask, deleteTask } = useTaskActions()
  const { subscribeToIdReplacement } = useLocalState()

  useEffect(() => {
    return subscribeToIdReplacement((tempId, realId) => {
      setParentId((prev) => (prev === tempId ? realId : prev))
      setActiveTask((prev) =>
        prev?.id === tempId ? { ...prev, id: realId } : prev,
      )
      setReturnToTaskStack((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t)),
      )
    })
  }, [subscribeToIdReplacement])

  const openCreateDialog = (pid?: number) => {
    if (mode === 'edit' && activeTask && pid !== undefined) {
      setReturnToTaskStack((prev) => [...prev, activeTask])
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
    setReturnToTaskStack([])
    setIsOpen(true)
  }

  const handleEditSubtask = (task: Task) => {
    if (activeTask) {
      setReturnToTaskStack((prev) => [...prev, activeTask])
    }
    setMode('edit')
    setActiveTask(task)
    setParentId(task.parentId ?? undefined)
    setIsOpen(true)
  }

  const closeDialog = () => {
    if (returnToTaskStack.length > 0) {
      const taskToReturn = returnToTaskStack[returnToTaskStack.length - 1]
      setReturnToTaskStack((prev) => prev.slice(0, -1))
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

  const hasChanges = (
    data: Record<string, unknown>,
    task: Record<string, unknown>,
  ) =>
    Object.keys(data).some((key) => {
      const a = data[key]
      const b = task[key]
      if (a === b) return false
      const sa = a instanceof Date ? a.toISOString() : JSON.stringify(a)
      const sb = b instanceof Date ? b.toISOString() : JSON.stringify(b)
      return sa !== sb
    })

  const handleSubmit = (data: MutateTaskContent) => {
    if (mode === 'create') {
      createTask({ ...data, parentId } as CreateTask)
      closeDialog()
    } else if (mode === 'edit' && activeTask) {
      if (
        hasChanges(
          data as Record<string, unknown>,
          activeTask as Record<string, unknown>,
        )
      ) {
        updateTask({ id: activeTask.id, ...data })
      }
      closeDialog()
    }
  }

  const handleAddSubtask = (pid: number, formData?: MutateTaskContent) => {
    if (formData) {
      const newTask = createTask({ ...formData, parentId } as CreateTask)
      setReturnToTaskStack((prev) => [...prev, newTask])
      setMode('create')
      setActiveTask(undefined)
      setParentId(newTask.id)
    } else {
      openCreateDialog(pid)
    }
  }

  const handleAssignSubtask = (task: Task, formData?: MutateTaskContent) => {
    if (formData) {
      const newTask = createTask({ ...formData, parentId } as CreateTask)
      setMode('edit')
      setActiveTask(newTask)
      setParentId(newTask.parentId ?? undefined)
      setReturnToTaskStack([])
      setAssignParentTask(newTask)
    } else {
      setAssignParentTask(task)
    }
  }

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

  const taskFormDialogProps: Omit<TaskFormDialogProps, 'setIsOpen' | 'mode'> = {
    isOpen,
    activeTask,
    parentId,
    onClose: closeDialog,
    onSubmit: handleSubmit,
    onAddSubtask: handleAddSubtask,
    onEditSubtask: handleEditSubtask,
    onDeleteSubtask: setSubtaskToDelete,
    onAssignSubtask: handleAssignSubtask,
  }

  const isMobile = useIsMobile()

  return (
    <TaskFormDialogContext.Provider
      value={{ openCreateDialog, openEditDialog, closeDialog }}
    >
      {children}

      {isMobile ? (
        <MobileDialog {...taskFormDialogProps} />
      ) : (
        <DesktopDialog
          {...taskFormDialogProps}
          setIsOpen={setIsOpen}
          mode={mode}
        />
      )}

      <SubtaskActionDialog
        open={!!subtaskToDelete && !showDeleteConfirm}
        onOpenChange={(open) => !open && setSubtaskToDelete(null)}
        taskName={subtaskToDelete?.name ?? ''}
        onDelete={() => setShowDeleteConfirm(true)}
        onRemoveAsSubtask={() => {
          if (subtaskToDelete) {
            updateTask({
              id: subtaskToDelete.id,
              parentId: null,
              hidden: false,
            })
            if (activeTask) {
              updateTask({
                id: activeTask.id,
                subtaskOrder: activeTask.subtaskOrder.filter(
                  (sid) => sid !== subtaskToDelete.id,
                ),
              })
            }
            setSubtaskToDelete(null)
          }
        }}
      />

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirm(false)
            setSubtaskToDelete(null)
          }
        }}
        taskName={subtaskToDelete?.name ?? ''}
        onConfirm={() => {
          if (subtaskToDelete) {
            deleteTask(subtaskToDelete.id)
            setShowDeleteConfirm(false)
            setSubtaskToDelete(null)
          }
        }}
      />

      {assignParentTask && (
        <AssignSubtaskDialog
          open={!!assignParentTask}
          onOpenChange={(open) => {
            if (!open) setAssignParentTask(null)
          }}
          parentTask={assignParentTask}
        />
      )}
    </TaskFormDialogContext.Provider>
  )
}
