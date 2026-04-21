/**
 * @fileoverview Context provider for task create/edit dialog with
 * desktop/mobile variants. Builds a navigation stack of tasks (real or draft)
 * being edited. All in-flight subtask additions and assignments live in
 * LocalStateProvider's draft session and are committed atomically on Submit
 * or discarded on Cancel.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useIsMobile } from '@/hooks/useMobile'
import { useTaskActions, useTasks } from '@/hooks/useTasks'
import { getTaskById } from '@/lib/task-utils'
import type {
  CreateTaskContent,
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

interface NavEntry {
  /** ID of task being edited at this nav level. Null = fresh-create (no draft yet). */
  taskId: number | null
  /** True if this entry was created via "Add Subtask" during the session.
   *  Backing out (Cancel) from such an entry deletes the draft. */
  isNewDraft: boolean
}

export enum TaskFormDialogMode {
  CREATE = 'create',
  EDIT = 'edit',
}

interface TaskFormDialogProps
  extends Pick<
    TaskFormProps,
    | 'onSubmit'
    | 'onAddSubtask'
    | 'onEditSubtask'
    | 'onDeleteSubtask'
    | 'onAssignSubtask'
    | 'isDraft'
  > {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  mode: TaskFormDialogMode
  parentId?: number
  activeTask?: Task
  formKey: string | number
  onClose: () => void
}

const DesktopDialog = ({
  isOpen,
  setIsOpen,
  mode,
  parentId,
  activeTask,
  formKey,
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
              {mode === TaskFormDialogMode.CREATE
                ? parentId
                  ? 'New Subtask'
                  : 'New Task'
                : 'Edit Task'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {mode === TaskFormDialogMode.CREATE
                ? 'Add a new item to your list.'
                : 'Update task details and properties.'}
            </DialogDescription>
          </div>
        </DialogHeader>
        <TaskForm
          {...taskFormArgs}
          key={formKey}
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
  formKey,
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
          key={formKey}
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
  const [navStack, setNavStack] = useState<NavEntry[]>([])
  const [freshCreateParentId, setFreshCreateParentId] = useState<number | null>(
    null,
  )
  const [subtaskToDelete, setSubtaskToDelete] = useState<DeleteTaskArgs | null>(
    null,
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  /** When non-null, AssignSubtaskDialog is open and the picked task should be
   *  assigned under this parent (real or draft). */
  const [assignTargetParentId, setAssignTargetParentId] = useState<
    number | null
  >(null)

  const { createTask, updateTask, deleteTask } = useTaskActions()
  const { data: tasksWithDrafts } = useTasks({ includeDrafts: true })
  const {
    createDraftTask,
    assignDraftSubtask,
    commitDraftSession,
    discardDraftSession,
    hasDraftSession,
    draftTaskIds,
    draftAssignmentCount,
    subscribeToIdReplacement,
  } = useLocalState()

  // Keep nav stack ids in sync when temp ids get replaced after server sync.
  useEffect(() => {
    return subscribeToIdReplacement((tempId, realId) => {
      setNavStack((prev) =>
        prev.map((e) => (e.taskId === tempId ? { ...e, taskId: realId } : e)),
      )
    })
  }, [subscribeToIdReplacement])

  const isMobile = useIsMobile()

  const currentEntry: NavEntry | null = navStack.at(-1) ?? null
  const rootEntry: NavEntry | null = navStack[0] ?? null
  const currentTask =
    currentEntry?.taskId != null
      ? getTaskById(tasksWithDrafts, currentEntry.taskId)
      : undefined
  const isDraftId = (id: number) => draftTaskIds.has(id)

  // The form's "parentId" prop drives the parent breadcrumb chain.
  const dialogParentId =
    currentEntry?.taskId === null
      ? (freshCreateParentId ?? undefined)
      : (currentTask?.parentId ?? undefined)

  // Submit button label: 'Create' for fresh-create / new draft entries.
  const dialogMode: TaskFormDialogMode =
    !currentEntry ||
    currentEntry.taskId === null ||
    currentEntry.isNewDraft ||
    (navStack.length === 1 &&
      currentEntry.taskId != null &&
      isDraftId(currentEntry.taskId))
      ? TaskFormDialogMode.CREATE
      : TaskFormDialogMode.EDIT

  // Pass undefined initialData for fresh-create so the form starts blank.
  // For new drafts (just added via "Add Subtask"), pass the draft task so
  // edits flow back to it through updateTask routing.
  const activeTask =
    currentEntry?.taskId != null && !currentEntry.isNewDraft
      ? currentTask
      : currentEntry?.taskId != null
        ? currentTask
        : undefined

  // Count for the cancel-confirm dialog. Excludes the root entry if it's a
  // draft (the root represents the entity being created, not a "subtask").
  const pendingSubtaskCount = (() => {
    const rootId = rootEntry?.taskId
    let drafts = draftTaskIds.size
    if (rootId != null && draftTaskIds.has(rootId)) drafts -= 1
    return drafts + draftAssignmentCount
  })()

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelPendingReset = () => {
    if (resetTimerRef.current != null) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }

  const resetAndClose = () => {
    discardDraftSession()
    setShowCancelConfirm(false)
    setIsOpen(false)
    cancelPendingReset()
    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null
      setNavStack([])
      setFreshCreateParentId(null)
    }, 300)
  }

  const openCreateDialog = (pid?: number) => {
    cancelPendingReset()
    discardDraftSession()
    setFreshCreateParentId(pid ?? null)
    setNavStack([{ taskId: null, isNewDraft: false }])
    setIsOpen(true)
  }

  const openEditDialog = (task: Task) => {
    cancelPendingReset()
    discardDraftSession()
    setFreshCreateParentId(null)
    setNavStack([{ taskId: task.id, isNewDraft: false }])
    setIsOpen(true)
  }

  const closeDialog = () => {
    if (navStack.length > 1) {
      const top = navStack.at(-1)
      // Backing out of a freshly-added subtask drops the draft.
      if (top?.isNewDraft && top.taskId != null && isDraftId(top.taskId)) {
        deleteTask(top.taskId)
      }
      setNavStack((prev) => prev.slice(0, -1))
      return
    }
    if (pendingSubtaskCount > 0) {
      setShowCancelConfirm(true)
      return
    }
    resetAndClose()
  }

  /** Promote a fresh-create entry to a draft root using the current form
   *  values. Returns the new draft id and updates the nav stack. */
  const promoteFreshToDraft = (data: MutateTaskContent): number => {
    const draft = createDraftTask({
      ...(data as CreateTaskContent),
      parentId: freshCreateParentId ?? undefined,
    } as CreateTaskContent)
    setNavStack((prev) =>
      prev.map((e, i) => (i === 0 ? { ...e, taskId: draft.id } : e)),
    )
    return draft.id
  }

  const handleSubmit = (data: MutateTaskContent) => {
    const top = navStack.at(-1)
    if (!top) return
    const isRoot = navStack.length === 1

    if (top.taskId === null) {
      // Fresh create with no draft: just create directly.
      createTask({
        ...(data as CreateTaskContent),
        parentId: freshCreateParentId ?? undefined,
      } as CreateTask)
      // Defensive: any stray drafts get committed (shouldn't exist here).
      if (hasDraftSession) commitDraftSession()
      resetAndClose()
      return
    }

    // Save form data to current entity. updateTask routes drafts internally.
    updateTask({ id: top.taskId, ...data })

    if (isRoot) {
      if (hasDraftSession) commitDraftSession()
      resetAndClose()
    } else {
      // Returning from a nested form: pop back to the parent.
      setNavStack((prev) => prev.slice(0, -1))
    }
  }

  const handleAddSubtask = (_pid: number, formData?: MutateTaskContent) => {
    const top = navStack.at(-1)
    if (!top || !formData) return

    let parentForChildId: number
    if (top.taskId === null) {
      // First subtask added in a fresh-create flow: promote the root form
      // into a draft, then add a draft child under it.
      parentForChildId = promoteFreshToDraft(formData)
    } else if (isDraftId(top.taskId)) {
      // Persist current draft edits — safe, never touches sync.
      updateTask({ id: top.taskId, ...formData })
      parentForChildId = top.taskId
    } else {
      // Real entity (edit mode): do NOT write form data here, so a subsequent
      // Cancel produces zero backend updates. Unsaved field edits are lost
      // when navigating away (matches prior behavior).
      parentForChildId = top.taskId
    }

    const child = createDraftTask({
      name: '',
      parentId: parentForChildId,
    } as CreateTaskContent)
    setNavStack((prev) => [...prev, { taskId: child.id, isNewDraft: true }])
  }

  const handleEditSubtask = (task: Task) => {
    setNavStack((prev) => [...prev, { taskId: task.id, isNewDraft: false }])
  }

  const handleAssignSubtask = (_task: Task, formData?: MutateTaskContent) => {
    const top = navStack.at(-1)
    if (!top || !formData) return

    let parentId: number
    if (top.taskId === null) {
      parentId = promoteFreshToDraft(formData)
    } else if (isDraftId(top.taskId)) {
      updateTask({ id: top.taskId, ...formData })
      parentId = top.taskId
    } else {
      parentId = top.taskId
    }
    setAssignTargetParentId(parentId)
  }

  const handleAssignConfirm = ({
    id: selectedId,
  }: Pick<Task, 'id' | 'name'>) => {
    if (assignTargetParentId === null) return
    if (isDraftId(assignTargetParentId)) {
      assignDraftSubtask(selectedId, assignTargetParentId)
    } else {
      // Real parent (editing an existing task): immediate update.
      updateTask({ id: selectedId, parentId: assignTargetParentId })
      const parent = getTaskById(tasksWithDrafts, assignTargetParentId)
      if (parent && parent.subtaskSortMode === SubtaskSortMode.MANUAL) {
        updateTask({
          id: assignTargetParentId,
          subtaskOrder: [...parent.subtaskOrder, selectedId],
        })
      }
    }
    setAssignTargetParentId(null)
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

  const getFormKey = (): string | number => {
    if (!currentEntry) return 'empty'
    if (currentEntry.taskId === null)
      return `new-${freshCreateParentId ?? 'root'}`
    return currentEntry.taskId
  }

  const taskFormDialogProps: Omit<TaskFormDialogProps, 'setIsOpen' | 'mode'> = {
    isOpen,
    activeTask,
    parentId: dialogParentId,
    formKey: getFormKey(),
    onClose: closeDialog,
    onSubmit: handleSubmit,
    onAddSubtask: handleAddSubtask,
    onEditSubtask: handleEditSubtask,
    onDeleteSubtask: setSubtaskToDelete,
    onAssignSubtask: handleAssignSubtask,
    isDraft: activeTask != null && draftTaskIds.has(activeTask.id),
  }

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
          mode={dialogMode}
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
            const top = currentEntry?.taskId
            if (top != null) {
              const parent = getTaskById(tasksWithDrafts, top)
              if (parent) {
                updateTask({
                  id: top,
                  subtaskOrder: parent.subtaskOrder.filter(
                    (sid) => sid !== subtaskToDelete.id,
                  ),
                })
              }
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
        open={assignTargetParentId !== null}
        onOpenChange={(open) => {
          if (!open) setAssignTargetParentId(null)
        }}
        parentTaskId={
          assignTargetParentId !== null && !isDraftId(assignTargetParentId)
            ? assignTargetParentId
            : null
        }
        onConfirm={handleAssignConfirm}
      />
    </TaskFormDialogContext.Provider>
  )
}
