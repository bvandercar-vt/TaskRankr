/**
 * @fileoverview Context provider for task create/edit dialog with
 * desktop/mobile variants.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useIsMobile } from '@/hooks/useMobile'
import { useTaskActions } from '@/hooks/useTasks'
import type {
  DeleteTaskArgs,
  MutateTaskContent,
} from '@/providers/LocalStateProvider'
import { useLocalState } from '@/providers/LocalStateProvider'
import type { CreateTask, Task } from '~/shared/schema'
import { SubtaskSortMode } from '~/shared/schema'
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../primitives/overlays/Dialog'
import type { PendingSubtask } from '../TaskForm/SubtasksCard'
import { AssignSubtaskDialog } from '../TaskForm/SubtasksCard/AssignSubtaskDialog'
import { SubtaskActionDialog } from '../TaskForm/SubtasksCard/SubtaskActionDialog'
import { TaskForm, type TaskFormProps } from '../TaskForm/TaskForm'
import { TaskFormCancelConfirmDialog } from '../TaskForm/TaskFormCancelConfirmDialog'

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
  const [pendingAssignedTasks, setPendingAssignedTasks] = useState<
    Pick<Task, 'id' | 'name'>[]
  >([])
  const [pendingAssignOpen, setPendingAssignOpen] = useState(false)

  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
  const [pendingNavStack, setPendingNavStack] = useState<number[]>([])
  const [showingChildForm, setShowingChildForm] = useState(false)
  const pendingIdRef = useRef(-10_000)

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
    setPendingAssignedTasks([])
    setPendingAssignOpen(false)
    pendingIdRef.current = -10_000
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

    if (!rootCreatedTask) {
      throw new Error('No tasks were created from pending tasks')
    }
    return rootCreatedTask
  }

  const getTopOfStack = <T extends boolean>(ensureNotNull?: T) => {
    const top = pendingNavStack.at(-1) ?? null
    if (ensureNotNull && top === null) {
      throw new Error('No top of stack found')
    }
    return top as T extends true ? number : number | null
  }

  const getCurrentPending = () => {
    const topId = getTopOfStack()
    if (topId === null) return null
    return pendingTasks.find((t) => t.localId === topId) ?? null
  }

  const getPendingSubtasksForTop = (): PendingSubtask[] => {
    const topId = getTopOfStack()
    if (topId === null) return []
    return pendingTasks
      .filter((t) => t.parentLocalId === topId)
      .map((t) => ({ name: t.data.name ?? '' }))
  }

  const getSessionParentId = (): number | undefined => {
    if (!isInSession) return parentId
    // -1 is a sentinel meaning "parent is a pending task with no real ID yet".
    // TaskForm's useTaskParentChain won't find it and will render no breadcrumbs,
    // which is the correct behaviour for a not-yet-created parent.
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
    const created = getPendingSubtasksForTop()
    const assigned = pendingAssignedTasks.map((t) => ({ name: t.name }))
    return [...created, ...assigned]
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
    ? pendingTasks.filter((t) => t.parentLocalId !== null).length +
      pendingAssignedTasks.length
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
        const parentLocalId = getTopOfStack(true)
        const localId = pendingIdRef.current--
        setPendingTasks((prev) => [...prev, { localId, data, parentLocalId }])
        setShowingChildForm(false)
        setActiveTask(undefined)
      } else if (isInSession && pendingNavStack.length === 1) {
        const rootLocalId = pendingNavStack[0]
        const finalTasks = pendingTasks.map((t) =>
          t.localId === rootLocalId ? { ...t, data } : t,
        )
        const rootTask = commitPendingTasks(finalTasks)
        for (const { id: assignedId } of pendingAssignedTasks) {
          updateTask({ id: assignedId, parentId: rootTask.id })
        }
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
        const currentLocalId = getTopOfStack(true)
        setPendingTasks((prev) =>
          prev.map((t) => (t.localId === currentLocalId ? { ...t, data } : t)),
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
        const parentLocalId = getTopOfStack(true)
        const localId = pendingIdRef.current--
        setPendingTasks((prev) => [
          ...prev,
          { localId, data: formData, parentLocalId },
        ])
        setPendingNavStack((prev) => [...prev, localId])
      } else {
        const currentLocalId = getTopOfStack(true)
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
      if (isInSession) {
        // Save current root form data without committing — defer until Submit
        const rootLocalId = pendingNavStack[0]
        setPendingTasks((prev) =>
          prev.map((t) =>
            t.localId === rootLocalId ? { ...t, data: formData } : t,
          ),
        )
        setPendingAssignOpen(true)
      } else {
        const newTask = createTask({ ...formData, parentId } as CreateTask)
        setMode('edit')
        setActiveTask(newTask)
        setParentId(newTask.parentId ?? undefined)
        setReturnToTask(undefined)
        setAssignParentTask(newTask)
      }
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

      <TaskFormCancelConfirmDialog
        open={showCancelConfirm}
        onOpenChange={(open) => {
          if (!open) setShowCancelConfirm(false)
        }}
        subtaskCount={pendingSubtaskCount}
        onDiscard={resetAndClose}
      />

      <AssignSubtaskDialog
        open={pendingAssignOpen || !!assignParentTask}
        onOpenChange={(open) => {
          if (!open) {
            setAssignParentTask(null)
            setPendingAssignOpen(false)
          }
        }}
        parentTaskId={assignParentTask?.id ?? null}
        onConfirm={({ id: selectedId, name }) => {
          if (pendingAssignOpen) {
            setPendingAssignedTasks((prev) => [
              ...prev,
              { id: selectedId, name },
            ])
          } else if (assignParentTask) {
            updateTask({ id: selectedId, parentId: assignParentTask.id })
            if (assignParentTask.subtaskSortMode === SubtaskSortMode.MANUAL) {
              updateTask({
                id: assignParentTask.id,
                subtaskOrder: [...assignParentTask.subtaskOrder, selectedId],
              })
            }
          }
        }}
      />
    </TaskFormDialogContext.Provider>
  )
}
