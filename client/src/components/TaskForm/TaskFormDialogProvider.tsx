/**
 * @fileoverview Context provider for task create/edit dialog with
 * desktop/mobile variants.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

import { useIsMobile } from '@/hooks/useMobile'
import { useTaskActions } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import type {
  DeleteTaskArgs,
  MutateTaskContent,
} from '@/providers/LocalStateProvider'
import { useLocalState } from '@/providers/LocalStateProvider'
import type { CreateTask, Task } from '~/shared/schema'
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog'
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
} from '../primitives/overlays/AlertDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../primitives/overlays/Dialog'
import { AssignSubtaskDialog } from '../TaskForm/SubtasksCard/AssignSubtaskDialog'
import type { PendingSubtask } from '../TaskForm/SubtasksCard/SubtasksCard'
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

interface PendingTask {
  localId: number
  data: MutateTaskContent
  parentLocalId: number | null
}

interface TaskFormDialogProps
  extends Pick<
    TaskFormProps,
    | 'onSubmit'
    | 'onAddSubtask'
    | 'onEditSubtask'
    | 'onDeleteSubtask'
    | 'onAssignSubtask'
    | 'defaultFormData'
    | 'pendingSubtasks'
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
        else setIsOpen(true)
      }}
    >
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
  const [returnToTask, setReturnToTask] = useState<Task | undefined>(undefined)

  const [subtaskToDelete, setSubtaskToDelete] = useState<DeleteTaskArgs | null>(
    null,
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [assignParentTask, setAssignParentTask] = useState<Task | null>(null)

  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
  const [pendingNavStack, setPendingNavStack] = useState<number[]>([])
  const [showingChildForm, setShowingChildForm] = useState(false)
  const pendingIdRef = useRef(-10000)

  const { createTask, updateTask, deleteTask } = useTaskActions()
  const { subscribeToIdReplacement } = useLocalState()

  useEffect(() => {
    return subscribeToIdReplacement((tempId, realId) => {
      setParentId((prev) => (prev === tempId ? realId : prev))
      setActiveTask((prev) =>
        prev?.id === tempId ? { ...prev, id: realId } : prev,
      )
      setReturnToTask((prev) =>
        prev?.id === tempId ? { ...prev, id: realId } : prev,
      )
    })
  }, [subscribeToIdReplacement])

  const isInSession = pendingNavStack.length > 0

  const resetSession = () => {
    setPendingTasks([])
    setPendingNavStack([])
    setShowingChildForm(false)
    pendingIdRef.current = -10000
  }

  const resetAndClose = () => {
    resetSession()
    setShowCancelConfirm(false)
    setIsOpen(false)
    setTimeout(() => {
      setActiveTask(undefined)
      setParentId(undefined)
      setReturnToTask(undefined)
    }, 300)
  }

  const commitPendingTasks = (pending: PendingTask[]): Task => {
    const localIdToRealId = new Map<number, number>()
    let rootCreatedTask: Task | null = null

    const sorted: PendingTask[] = []
    const added = new Set<number>()

    const addNode = (localId: number) => {
      if (added.has(localId)) return
      const node = pending.find((t) => t.localId === localId)
      if (!node) return
      if (node.parentLocalId !== null && !added.has(node.parentLocalId)) {
        addNode(node.parentLocalId)
      }
      sorted.push(node)
      added.add(localId)
    }

    for (const t of pending) addNode(t.localId)

    for (const task of sorted) {
      const realParentId =
        task.parentLocalId !== null
          ? localIdToRealId.get(task.parentLocalId)
          : undefined
      const created = createTask({
        ...task.data,
        parentId: realParentId,
      } as CreateTask)
      localIdToRealId.set(task.localId, created.id)
      if (!rootCreatedTask) rootCreatedTask = created
    }

    return rootCreatedTask!
  }

  const getTopOfStack = () =>
    pendingNavStack.length > 0
      ? pendingNavStack[pendingNavStack.length - 1]
      : null

  const getCurrentPending = () => {
    const topId = getTopOfStack()
    return topId !== null
      ? pendingTasks.find((t) => t.localId === topId) ?? null
      : null
  }

  const getPendingSubtasksForTop = (): PendingSubtask[] => {
    const topId = getTopOfStack()
    if (topId === null) return []
    return pendingTasks
      .filter((t) => t.parentLocalId === topId)
      .map((t) => ({ name: (t.data as { name: string }).name }))
  }

  const getSessionParentId = (): number | undefined => {
    if (!isInSession) return parentId
    if (showingChildForm) return -1
    const current = getCurrentPending()
    return current?.parentLocalId != null ? current.parentLocalId : undefined
  }

  const getSessionDefaultFormData = (): MutateTaskContent | undefined => {
    if (!isInSession || showingChildForm) return undefined
    return getCurrentPending()?.data
  }

  const getSessionPendingSubtasks = (): PendingSubtask[] => {
    if (!isInSession || showingChildForm) return []
    return getPendingSubtasksForTop()
  }

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
    resetSession()
    setIsOpen(true)
  }

  const handleEditSubtask = (task: Task) => {
    if (activeTask) {
      setReturnToTask(activeTask)
    }
    setMode('edit')
    setActiveTask(task)
    setParentId(task.parentId ?? undefined)
    setIsOpen(true)
  }

  const pendingSubtaskCount = isInSession
    ? pendingTasks.filter((t) => t.parentLocalId !== null).length
    : 0

  const closeDialog = () => {
    if (returnToTask) {
      const taskToReturn = returnToTask
      resetSession()
      setShowCancelConfirm(false)
      setReturnToTask(undefined)
      setMode('edit')
      setActiveTask(taskToReturn)
      setParentId(taskToReturn.parentId ?? undefined)
    } else if (isInSession && showingChildForm) {
      setShowingChildForm(false)
      setActiveTask(undefined)
    } else if (isInSession && pendingNavStack.length > 1) {
      setPendingNavStack((prev) => prev.slice(0, -1))
      setActiveTask(undefined)
    } else if (isInSession && pendingSubtaskCount > 0) {
      setShowCancelConfirm(true)
    } else {
      resetAndClose()
    }
  }

  const handleSubmit = (data: MutateTaskContent) => {
    if (mode === 'create') {
      if (isInSession && showingChildForm) {
        const parentLocalId = getTopOfStack()!
        const localId = pendingIdRef.current--
        setPendingTasks((prev) => [
          ...prev,
          { localId, data, parentLocalId },
        ])
        setShowingChildForm(false)
        setActiveTask(undefined)
      } else if (isInSession && pendingNavStack.length === 1) {
        const rootLocalId = pendingNavStack[0]
        const finalTasks = pendingTasks.map((t) =>
          t.localId === rootLocalId ? { ...t, data } : t,
        )
        commitPendingTasks(finalTasks)
        if (returnToTask) {
          const taskToReturn = returnToTask
          resetSession()
          setShowCancelConfirm(false)
          setReturnToTask(undefined)
          setMode('edit')
          setActiveTask(taskToReturn)
          setParentId(taskToReturn.parentId ?? undefined)
        } else {
          resetAndClose()
        }
      } else if (isInSession && pendingNavStack.length > 1) {
        const currentLocalId = getTopOfStack()!
        setPendingTasks((prev) =>
          prev.map((t) =>
            t.localId === currentLocalId ? { ...t, data } : t,
          ),
        )
        setPendingNavStack((prev) => prev.slice(0, -1))
        setActiveTask(undefined)
      } else {
        createTask({ ...data, parentId } as CreateTask)
        if (returnToTask) {
          const taskToReturn = returnToTask
          setReturnToTask(undefined)
          setMode('edit')
          setActiveTask(taskToReturn)
          setParentId(taskToReturn.parentId ?? undefined)
        } else {
          resetAndClose()
        }
      }
    } else if (mode === 'edit' && activeTask) {
      updateTask({ id: activeTask.id, ...data })
      if (returnToTask) {
        const taskToReturn = returnToTask
        setReturnToTask(undefined)
        setMode('edit')
        setActiveTask(taskToReturn)
        setParentId(taskToReturn.parentId ?? undefined)
      } else {
        resetAndClose()
      }
    }
  }

  const handleAddSubtask = (pid: number, formData?: MutateTaskContent) => {
    if (formData) {
      if (!isInSession) {
        const localId = pendingIdRef.current--
        setPendingTasks([{ localId, data: formData, parentLocalId: null }])
        setPendingNavStack([localId])
        setShowingChildForm(true)
      } else if (showingChildForm) {
        const parentLocalId = getTopOfStack()!
        const localId = pendingIdRef.current--
        setPendingTasks((prev) => [
          ...prev,
          { localId, data: formData, parentLocalId },
        ])
        setPendingNavStack((prev) => [...prev, localId])
      } else {
        const currentLocalId = getTopOfStack()!
        setPendingTasks((prev) =>
          prev.map((t) =>
            t.localId === currentLocalId ? { ...t, data: formData } : t,
          ),
        )
        setShowingChildForm(true)
      }
      setMode('create')
      setActiveTask(undefined)
    } else {
      openCreateDialog(pid)
    }
  }

  const handleAssignSubtask = (task: Task, formData?: MutateTaskContent) => {
    if (formData) {
      let newTask: Task
      if (isInSession) {
        const rootLocalId = pendingNavStack[0]
        const finalTasks = pendingTasks.map((t) =>
          t.localId === rootLocalId ? { ...t, data: formData } : t,
        )
        newTask = commitPendingTasks(finalTasks)
        resetSession()
      } else {
        newTask = createTask({ ...formData, parentId } as CreateTask)
      }
      setMode('edit')
      setActiveTask(newTask)
      setParentId(newTask.parentId ?? undefined)
      setReturnToTask(undefined)
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

  const sessionParentId = getSessionParentId()
  const sessionDefaultFormData = getSessionDefaultFormData()
  const sessionPendingSubtasks = getSessionPendingSubtasks()

  const taskFormDialogProps: Omit<TaskFormDialogProps, 'setIsOpen' | 'mode'> = {
    isOpen,
    activeTask,
    parentId: sessionParentId,
    onClose: closeDialog,
    onSubmit: handleSubmit,
    onAddSubtask: handleAddSubtask,
    onEditSubtask: handleEditSubtask,
    onDeleteSubtask: setSubtaskToDelete,
    onAssignSubtask: handleAssignSubtask,
    defaultFormData: sessionDefaultFormData,
    pendingSubtasks: sessionPendingSubtasks,
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

      <AlertDialog
        open={showCancelConfirm}
        onOpenChange={(open) => {
          if (!open) setShowCancelConfirm(false)
        }}
      >
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
              <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
              <AlertDialogDescription>
                You have created {pendingSubtaskCount}{' '}
                {pendingSubtaskCount === 1 ? 'subtask' : 'subtasks'}.{' '}
                {pendingSubtaskCount === 1 ? 'It' : 'They'} will not be created
                if you cancel this parent task.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                className="bg-secondary/50 border-white/5 hover:bg-white/10"
                data-testid="button-cancel-confirm-back"
              >
                Go Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={resetAndClose}
                className="bg-destructive hover:bg-destructive/90 text-white"
                data-testid="button-cancel-confirm-discard"
              >
                Discard All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
      </AlertDialog>

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
