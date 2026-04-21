/**
 * @fileoverview Local-first state provider for tasks.
 * Manages tasks in-memory + localStorage persistence. Every task mutation also
 * pushes an entry onto the task sync queue owned by `TaskSyncQueueProvider` (which
 * must wrap this provider); `SyncProvider` drains that queue in the
 * background.
 *
 * Settings live in `SettingsProvider` — independent context, independent sync
 * pointer. SyncProvider drains both.
 *
 * The TaskForm dialog's in-memory draft session (drafts, parent reassignments,
 * order overrides, and `tasksWithDrafts` overlay) lives in
 * `DraftSessionProvider`, which wraps this provider. Mutators here are
 * draft-unaware; the dialog subtree consumes draft-aware mutators from
 * `useDraftSession()` instead.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { omit } from 'es-toolkit'
import type { z } from 'zod'

import { toast } from '@/hooks/useToast'
import { debugLog } from '@/lib/debug-logger'
import { createDemoTasks } from '@/lib/demo-tasks'
import { getStorageKeys, type StorageMode, storage } from '@/lib/storage'
import {
  getById,
  getChildrenLatestCompletedAt,
  getDirectSubtasks,
  getHasIncompleteSubtasks,
  removeIds,
  updateItem,
} from '@/lib/task-tree-utils'
import { useSettings } from '@/providers/SettingsProvider'
import {
  type SyncOperation,
  SyncOperationType,
  useTaskSyncQueue,
} from '@/providers/TaskSyncQueueProvider'
import {
  allRankFieldsNull,
  type CreateTask,
  SubtaskSortMode,
  type Task,
  TaskStatus,
  taskSchema,
  type UpdateTask,
} from '~/shared/schema'

export type CreateTaskContent = Omit<CreateTask, 'userId' | 'id'>
export type UpdateTaskContent = Omit<UpdateTask, 'id'>
export type MutateTaskContent = CreateTaskContent | UpdateTaskContent
export type DeleteTaskArgs = Pick<Task, 'id' | 'name'>

interface LocalStateContextValue {
  // Tasks
  tasks: Task[]
  isInitialized: boolean
  hasDemoData: boolean
  deleteDemoData: () => void

  // Task mutations
  createTask: (data: CreateTaskContent) => Task
  updateTask: (id: number, updates: UpdateTaskContent) => Task
  setTaskStatus: (id: number, status: TaskStatus) => Task
  deleteTask: (id: number) => void
  reorderSubtasks: (parentId: number, orderedIds: number[]) => void
  subscribeToIdReplacement: (
    cb: (tempId: number, realId: number) => void,
  ) => () => void

  // Server sync bridge (used by SyncProvider). The task sync queue itself
  // lives in TaskSyncQueueProvider — these are the tasks-side bridge methods.
  replaceTaskId: (tempId: number, realId: number) => void
  setTasksFromServer: (tasks: Task[]) => void
}

const LocalStateContext = createContext<LocalStateContextValue | null>(null)

// TODO: we haven't stored with subtasks in a while, I think we can remove the flattening.
const loadTasksFromStorage = (key: string): Task[] => {
  type TasksInStorage = (Task & { subtasks?: Task[] })[]
  try {
    const parsed = storage.get<TasksInStorage>(key, [])
    const flatten = (tasks: TasksInStorage): Task[] => {
      const result: Task[] = []
      for (const t of tasks) {
        result.push(taskSchema.parse(t))
        if (t.subtasks?.length) {
          result.push(...flatten(t.subtasks))
        }
      }
      return result
    }
    return flatten(parsed)
  } catch {
    return []
  }
}

interface LocalStateProviderProps {
  children: React.ReactNode
  shouldSync: boolean
  storageMode: StorageMode
}

interface ReconcileResult {
  tasks: Task[]
  corrections: { id: number; status: TaskStatus }[]
}

function reconcileInheritCompletionState(tasks: Task[]): ReconcileResult {
  const corrections: { id: number; status: TaskStatus }[] = []
  let updated = tasks
  let changed = true

  while (changed) {
    changed = false
    const parents = updated.filter((t) => t.inheritCompletionState)
    for (const parent of parents) {
      const children = getDirectSubtasks(updated, parent.id)
      if (children.length === 0) continue

      const allChildrenCompleted = children.every(
        (c) => c.status === TaskStatus.COMPLETED,
      )

      if (allChildrenCompleted && parent.status !== TaskStatus.COMPLETED) {
        const latestCompletedAt = getChildrenLatestCompletedAt(children)

        const shouldHide = parent.parentId
          ? (getById(updated, parent.parentId)?.autoHideCompleted ?? false)
          : false

        updated = updateItem(updated, parent.id, (t) => ({
          ...t,
          status: TaskStatus.COMPLETED,
          completedAt: latestCompletedAt ?? new Date(),
          inProgressStartedAt: null,
          ...(shouldHide ? { hidden: true } : {}),
        }))

        if (shouldHide) {
          const toHide = new Set<number>()
          let currentLevel = new Set<number>([parent.id])
          while (currentLevel.size > 0) {
            const nextLevel = new Set<number>()
            for (const t of updated) {
              if (
                t.parentId !== null &&
                currentLevel.has(t.parentId) &&
                !toHide.has(t.id)
              ) {
                toHide.add(t.id)
                nextLevel.add(t.id)
              }
            }
            currentLevel = nextLevel
          }
          if (toHide.size > 0) {
            updated = updated.map((t) =>
              toHide.has(t.id) ? { ...t, hidden: true } : t,
            )
          }
        }

        corrections.push({ id: parent.id, status: TaskStatus.COMPLETED })
        changed = true
      } else if (
        !allChildrenCompleted &&
        parent.status === TaskStatus.COMPLETED
      ) {
        updated = updateItem(updated, parent.id, (t) => ({
          ...t,
          status: TaskStatus.OPEN,
          completedAt: null,
          inProgressStartedAt: null,
        }))
        corrections.push({ id: parent.id, status: TaskStatus.OPEN })
        changed = true
      }
    }
  }

  return { tasks: updated, corrections }
}

export const LocalStateProvider = ({
  children,
  shouldSync,
  storageMode,
}: LocalStateProviderProps) => {
  const { settings } = useSettings()
  const { syncQueue, enqueue, enqueueMany, replaceTempIdInQueue } =
    useTaskSyncQueue()
  const [isInitialized, setIsInitialized] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [demoTaskIds, setDemoTaskIds] = useState<number[]>([])
  const nextIdRef = useRef(-1)
  const tasksRef = useRef<Task[]>([])
  // Capture the initial sync queue once so the init effect can scan for
  // orphaned negative-id tasks without re-running when the queue changes.
  const initialQueueRef = useRef(syncQueue)
  const idReplacedCallbacks = useRef<
    Set<(tempId: number, realId: number) => void>
  >(new Set())

  const subscribeToIdReplacement = useCallback(
    (cb: (tempId: number, realId: number) => void) => {
      idReplacedCallbacks.current.add(cb)
      return () => {
        idReplacedCallbacks.current.delete(cb)
      }
    },
    [],
  )

  const storageKeys = useMemo(() => getStorageKeys(storageMode), [storageMode])

  const reconcileAndSetTasks = useCallback(
    (incomingTasks: Task[], source: string) => {
      const { tasks: reconciled, corrections } =
        reconcileInheritCompletionState(incomingTasks)
      setTasks(reconciled)
      if (corrections.length > 0) {
        debugLog.log('reconcile', `inheritCompletionState:${source}`, {
          corrections,
        })
        enqueueMany(
          corrections.map(
            (c) =>
              ({
                type: SyncOperationType.SET_STATUS,
                id: c.id,
                status: c.status,
              }) as const,
          ),
        )
      }
    },
    [enqueueMany],
  )

  useEffect(() => {
    const loadedTasks: Task[] = loadTasksFromStorage(storageKeys.tasks)
    const loadedNextId: number = storage.get<number>(storageKeys.nextId, -1)
    const loadedDemoIds: number[] = storage.get<number[]>(
      storageKeys.demoTaskIds,
      [],
    )

    nextIdRef.current = loadedNextId
    setDemoTaskIds(loadedDemoIds)

    // Recovery: any persisted task with a negative id is an unsynced create
    // (drafts are never persisted). If its CREATE_TASK op is missing from the
    // queue (e.g. dropped by a previous version of the sync code), re-enqueue
    // it so the server assigns a real id. Enqueue parents before children so
    // the in-flight idMap can resolve parentId references in order.
    if (shouldSync && loadedTasks.length > 0) {
      const loadedQueue = initialQueueRef.current
      const queuedTempIds = new Set(
        loadedQueue
          .filter((op) => op.type === SyncOperationType.CREATE_TASK)
          .map((op) => (op as { tempId: number }).tempId),
      )
      const taskById = new Map(loadedTasks.map((t) => [t.id, t]))
      const orphaned: Task[] = loadedTasks.filter(
        (t) =>
          t.id < 0 &&
          !queuedTempIds.has(t.id) &&
          // "Parent exists" means either no parent, parent is a real task, or
          // parent is another negative-id task we'll also be re-enqueuing.
          !(t.parentId != null && !taskById.has(t.parentId)),
      )
      if (orphaned.length > 0) {
        // Topo-sort: a task must appear after its (negative-id) parent, but
        // only traverse to parents that are themselves in the recoverable
        // set — never re-add a parent that already has a queued CREATE op.
        const recoverableIds = new Set(orphaned.map((t) => t.id))
        const sorted: Task[] = []
        const visited = new Set<number>()
        const visit = (t: Task) => {
          if (visited.has(t.id)) return
          visited.add(t.id)
          if (
            t.parentId != null &&
            t.parentId < 0 &&
            recoverableIds.has(t.parentId)
          ) {
            const parent = taskById.get(t.parentId)
            if (parent) visit(parent)
          }
          sorted.push(t)
        }
        for (const t of orphaned) visit(t)

        const recoveryOps: SyncOperation[] = sorted.map((t) => ({
          type: SyncOperationType.CREATE_TASK,
          tempId: t.id,
          data: omit(t, ['id', 'userId']),
        }))
        enqueueMany(recoveryOps)
        debugLog.log('sync', 'recoverOrphanedTasks', {
          count: recoveryOps.length,
          tempIds: sorted.map((t) => t.id),
        })
      }
    }

    if (loadedTasks.length === 0) {
      const demoTasks = createDemoTasks(nextIdRef)
      storage.set(storageKeys.nextId, nextIdRef.current)
      storage.remove(getStorageKeys(storageMode).expanded)
      setDemoTaskIds(demoTasks.map((t) => t.id))
      setTasks(demoTasks)
    } else {
      reconcileAndSetTasks(loadedTasks, 'init')
    }

    setIsInitialized(true)
  }, [storageKeys, storageMode, reconcileAndSetTasks, shouldSync, enqueueMany])

  useEffect(() => {
    if (isInitialized) {
      storage.set(storageKeys.tasks, tasks)
    }
  }, [tasks, isInitialized, storageKeys])

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // Helper to update a task by ID
  const updateTaskById = useCallback(
    (
      id: number,
      updateThisTask: (task: Task) => Partial<Task>,
      updateOtherTasks?: (task: Task) => Partial<Task>,
    ): Task | undefined => {
      let updatedTask: Task | undefined
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === id) {
            updatedTask = { ...task, ...updateThisTask(task) }
            return updatedTask
          }
          if (updateOtherTasks) {
            const otherUpdates = updateOtherTasks(task)
            return { ...task, ...otherUpdates }
          }
          return task
        }),
      )
      return updatedTask
    },
    [],
  )

  const replaceTaskId = useCallback(
    (tempId: number, realId: number) => {
      setTasks((prev) =>
        prev.map((t) => ({
          ...(t.id === tempId ? { ...t, id: realId } : t),
          parentId: t.parentId === tempId ? realId : t.parentId,
          subtaskOrder: t.subtaskOrder.map((sid) =>
            sid === tempId ? realId : sid,
          ),
        })),
      )
      replaceTempIdInQueue(tempId, realId)
      idReplacedCallbacks.current.forEach((cb) => {
        cb(tempId, realId)
      })
    },
    [replaceTempIdInQueue],
  )

  const createTask = useCallback(
    (data: CreateTaskContent): Task => {
      const tempId = nextIdRef.current--
      storage.set(storageKeys.nextId, nextIdRef.current)

      const newStatus = (() => {
        if (data.status && data.status !== TaskStatus.OPEN) return data.status
        const pinNew = settings.autoPinNewTasks && !data.parentId
        return pinNew ? TaskStatus.PINNED : TaskStatus.OPEN
      })()

      const newTask: Task = taskSchema.parse({
        ...allRankFieldsNull,
        ...data,
        id: tempId,
        userId: 'local',
        status: newStatus,
      } satisfies z.input<typeof taskSchema>)

      setTasks((prev) => {
        const parent = data.parentId ? getById(prev, data.parentId) : undefined
        if (
          parent?.autoHideCompleted &&
          newTask.status === TaskStatus.COMPLETED
        ) {
          newTask.hidden = true
        }
        let updated = [...prev, newTask]
        if (data.parentId) {
          updated = updated.map((t) => {
            if (t.id !== data.parentId) return t
            const changes: Partial<Task> = {}
            if (t.subtaskSortMode === SubtaskSortMode.MANUAL) {
              changes.subtaskOrder = [...t.subtaskOrder, tempId]
            }
            if (
              t.inheritCompletionState &&
              t.status === TaskStatus.COMPLETED &&
              newTask.status !== TaskStatus.COMPLETED
            ) {
              changes.status = TaskStatus.OPEN
              changes.completedAt = null
              changes.inProgressStartedAt = null
            }
            return { ...t, ...changes }
          })
        }
        return updated
      })
      const syncData = (() => {
        let d = { ...data, status: newStatus }
        if (newTask.hidden && !data.hidden) d = { ...d, hidden: true }
        return d
      })()
      enqueue({ type: SyncOperationType.CREATE_TASK, tempId, data: syncData })
      debugLog.log('task', 'create', {
        tempId,
        name: data.name,
        parentId: data.parentId,
      })

      return newTask
    },
    [settings.autoPinNewTasks, enqueue, storageKeys],
  )

  const updateTask = useCallback(
    (id: number, updates: UpdateTaskContent): Task => {
      const updatedTask = updateTaskById(id, () => updates)
      enqueue({ type: SyncOperationType.UPDATE_TASK, id, data: updates })
      debugLog.log('task', 'update', { id, updates })

      if (updates.autoHideCompleted !== undefined) {
        const hide = updates.autoHideCompleted
        setTasks((prev) => {
          const completedDirectIds = new Set(
            getDirectSubtasks(prev, id)
              .filter((t) => t.status === TaskStatus.COMPLETED)
              .map((t) => t.id),
          )
          const toHide = new Set<number>(completedDirectIds)
          const collectDescendants = (parentIds: Set<number>) => {
            for (const t of prev) {
              if (
                t.parentId !== null &&
                parentIds.has(t.parentId) &&
                !toHide.has(t.id)
              ) {
                toHide.add(t.id)
              }
            }
          }
          let prevSize = 0
          while (toHide.size > prevSize) {
            prevSize = toHide.size
            collectDescendants(toHide)
          }
          return prev.map((t) =>
            toHide.has(t.id) ? { ...t, hidden: hide } : t,
          )
        })
      }

      if (
        updates.inheritCompletionState === true &&
        updatedTask &&
        updatedTask.status === TaskStatus.COMPLETED &&
        getHasIncompleteSubtasks(tasksRef.current, id)
      ) {
        updateTaskById(id, () => ({
          status: TaskStatus.OPEN,
          completedAt: null,
          inProgressStartedAt: null,
        }))
        enqueue({
          type: SyncOperationType.SET_STATUS,
          id,
          status: TaskStatus.OPEN,
        })
      }

      if (updates.parentId != null && updatedTask) {
        const parent = getById(tasksRef.current, updates.parentId)
        if (
          parent?.inheritCompletionState &&
          parent.status === TaskStatus.COMPLETED &&
          updatedTask.status !== TaskStatus.COMPLETED
        ) {
          updateTaskById(parent.id, () => ({
            status: TaskStatus.OPEN,
            completedAt: null,
            inProgressStartedAt: null,
          }))
        }
      }

      // biome-ignore lint/style/noNonNullAssertion: from Replit. Maybe we should investigate? Throw an error if not defined?
      return updatedTask!
    },
    [enqueue, updateTaskById],
  )

  const setTaskStatus = useCallback(
    (id: number, status: TaskStatus): Task => {
      if (status === TaskStatus.COMPLETED) {
        const hasIncompleteSubtasks = getHasIncompleteSubtasks(
          tasksRef.current,
          id,
        )
        if (hasIncompleteSubtasks) {
          toast({
            title: 'Cannot complete task',
            description: 'All subtasks must be completed first.',
            variant: 'destructive',
          })
          const existing = getById(tasksRef.current, id)
          if (existing) return existing
        }
      }

      const updatedTask = updateTaskById(
        id,
        (task) => {
          const base = (() => {
            switch (status) {
              case TaskStatus.IN_PROGRESS:
                return {
                  status: TaskStatus.IN_PROGRESS,
                  inProgressStartedAt: new Date(),
                }
              case TaskStatus.COMPLETED:
                return {
                  status: TaskStatus.COMPLETED,
                  completedAt: new Date(),
                  inProgressStartedAt: null,
                }
              default:
                return {
                  status,
                  inProgressStartedAt: null,
                }
            }
          })()

          if (status === TaskStatus.COMPLETED && task.parentId) {
            const parent = getById(tasksRef.current, task.parentId)
            if (parent?.autoHideCompleted) {
              return { ...base, hidden: true }
            }
          }

          return base
        },
        // Clear IN_PROGRESS status from other tasks when setting a new task to IN_PROGRESS
        status === TaskStatus.IN_PROGRESS
          ? (t) =>
              t.status === TaskStatus.IN_PROGRESS
                ? {
                    status: TaskStatus.PINNED,
                    inProgressStartedAt: null,
                  }
                : {}
          : undefined,
      )

      enqueue({ type: SyncOperationType.SET_STATUS, id, status })
      debugLog.log('task', 'setStatus', { id, status })

      if (status === TaskStatus.COMPLETED && updatedTask?.hidden) {
        setTasks((prev) => {
          const toHide = new Set<number>()
          let currentLevel = new Set<number>([id])
          while (currentLevel.size > 0) {
            const nextLevel = new Set<number>()
            for (const t of prev) {
              if (
                t.parentId !== null &&
                currentLevel.has(t.parentId) &&
                !toHide.has(t.id)
              ) {
                toHide.add(t.id)
                nextLevel.add(t.id)
              }
            }
            currentLevel = nextLevel
          }
          if (toHide.size === 0) return prev
          return prev.map((t) =>
            toHide.has(t.id) ? { ...t, hidden: true } : t,
          )
        })
      }

      if (status === TaskStatus.COMPLETED && updatedTask?.parentId) {
        const autoCompletedParents: number[] = []

        setTasks((prev) => {
          let updated = prev
          let currentParentId: number | null = updatedTask.parentId

          while (currentParentId !== null) {
            const parent = getById(updated, currentParentId)
            if (
              !parent?.inheritCompletionState ||
              parent.status === TaskStatus.COMPLETED
            )
              break

            const thisChildren = getDirectSubtasks(updated, parent.id)
            if (!thisChildren.every((t) => t.status === TaskStatus.COMPLETED))
              break

            const latestCompletedAt = getChildrenLatestCompletedAt(thisChildren)

            const parentUpdate: Partial<Task> = {
              status: TaskStatus.COMPLETED,
              completedAt: latestCompletedAt ?? new Date(),
              inProgressStartedAt: null,
            }

            if (parent.parentId) {
              const grandparent = getById(updated, parent.parentId)
              if (grandparent?.autoHideCompleted) {
                parentUpdate.hidden = true
              }
            }

            updated = updateItem(updated, parent.id, (t) => ({
              ...t,
              ...parentUpdate,
            }))
            autoCompletedParents.push(parent.id)

            currentParentId = parent.parentId
          }

          return updated === prev ? prev : updated
        })

        for (const parentId of autoCompletedParents) {
          enqueue({
            type: SyncOperationType.SET_STATUS,
            id: parentId,
            status: TaskStatus.COMPLETED,
          })
          debugLog.log('task', 'inheritCompletion', { parentId })
        }
      }

      if (status !== TaskStatus.COMPLETED && updatedTask?.parentId) {
        const autoRevertedParents: number[] = []

        setTasks((prev) => {
          let updated = prev
          let currentParentId: number | null = updatedTask.parentId

          while (currentParentId !== null) {
            const parent = getById(updated, currentParentId)
            if (!parent?.inheritCompletionState) break
            if (parent.status !== TaskStatus.COMPLETED) break

            updated = updateItem(updated, parent.id, (t) => ({
              ...t,
              status: TaskStatus.OPEN,
              completedAt: null,
              inProgressStartedAt: null,
            }))
            autoRevertedParents.push(parent.id)

            currentParentId = parent.parentId
          }

          return updated === prev ? prev : updated
        })

        for (const parentId of autoRevertedParents) {
          enqueue({
            type: SyncOperationType.SET_STATUS,
            id: parentId,
            status: TaskStatus.OPEN,
          })
          debugLog.log('task', 'inheritCompletion:revert', { parentId })
        }
      }

      // biome-ignore lint/style/noNonNullAssertion: from Replit. Maybe we should investigate? Throw an error if not defined?
      return updatedTask!
    },
    [enqueue, updateTaskById],
  )

  const deleteTask = useCallback(
    (id: number) => {
      setTasks((prev) => {
        const taskToDelete = getById(prev, id)
        if (!taskToDelete) return prev

        const idsToDelete = new Set<number>()
        const collectDescendants = (parentId: number) => {
          idsToDelete.add(parentId)
          for (const t of prev) {
            if (t.parentId === parentId) collectDescendants(t.id)
          }
        }
        collectDescendants(id)

        let totalTime = 0
        for (const t of prev) {
          if (idsToDelete.has(t.id)) totalTime += t.timeSpent
        }

        let updated = removeIds(prev, idsToDelete)

        if (taskToDelete.parentId) {
          updated = updateItem(updated, taskToDelete.parentId, (t) => ({
            ...t,
            ...(totalTime > 0
              ? { timeSpent: (t.timeSpent ?? 0) + totalTime }
              : {}),
            subtaskOrder: t.subtaskOrder.filter((sid) => !idsToDelete.has(sid)),
          }))
        }

        return updated
      })
      enqueue({ type: SyncOperationType.DELETE_TASK, id })
      debugLog.log('task', 'delete', { id })
    },
    [enqueue],
  )

  const reorderSubtasks = useCallback(
    (parentId: number, orderedIds: number[]) => {
      updateTaskById(parentId, () => ({ subtaskOrder: orderedIds }))
      enqueue({
        type: SyncOperationType.REORDER_SUBTASKS,
        parentId,
        orderedIds,
      })
      debugLog.log('task', 'reorderSubtasks', { parentId, orderedIds })
    },
    [enqueue, updateTaskById],
  )

  const setTasksFromServer = useCallback(
    (serverTasks: Task[]) => {
      if (serverTasks.length === 0 && demoTaskIds.length > 0) {
        debugLog.log('sync', 'setTasksFromServer:skipped', {
          reason: 'empty server, has demo data',
        })
        return
      }
      if (serverTasks.length > 0) {
        setDemoTaskIds([])
      }

      const validIds = new Set(serverTasks.map((t) => t.id))
      const orphaned: Task[] = []
      const sanitized = serverTasks.map((t) => {
        if (t.parentId !== null && !validIds.has(t.parentId)) {
          orphaned.push(t)
          return { ...t, parentId: null }
        }
        return t
      })

      if (orphaned.length > 0) {
        debugLog.log('sync', 'setTasksFromServer:orphanedParentIds', {
          ids: orphaned.map((t) => t.id),
        })
        enqueueMany(
          orphaned.map(
            (t) =>
              ({
                type: SyncOperationType.UPDATE_TASK,
                id: t.id,
                data: { parentId: null },
              }) as const,
          ),
        )
      }

      reconcileAndSetTasks(sanitized, 'fromServer')
      nextIdRef.current = -1
      storage.set(storageKeys.nextId, -1)
      debugLog.log('sync', 'setTasksFromServer', { count: serverTasks.length })
    },
    [storageKeys, demoTaskIds, reconcileAndSetTasks, enqueueMany],
  )

  useEffect(() => {
    if (isInitialized) {
      storage.set(storageKeys.demoTaskIds, demoTaskIds)
    }
  }, [demoTaskIds, isInitialized, storageKeys])

  const deleteDemoData = useCallback(() => {
    setTasks((prev) => removeIds(prev, demoTaskIds))
    setDemoTaskIds([])
  }, [demoTaskIds])

  const hasDemoData =
    demoTaskIds.length > 0 && tasks.some((t) => demoTaskIds.includes(t.id))

  const value = useMemo<LocalStateContextValue>(
    () => ({
      tasks,
      isInitialized,
      hasDemoData,
      deleteDemoData,
      createTask,
      updateTask,
      setTaskStatus,
      deleteTask,
      reorderSubtasks,
      subscribeToIdReplacement,
      replaceTaskId,
      setTasksFromServer,
    }),
    [
      tasks,
      isInitialized,
      hasDemoData,
      deleteDemoData,
      createTask,
      updateTask,
      setTaskStatus,
      deleteTask,
      reorderSubtasks,
      subscribeToIdReplacement,
      replaceTaskId,
      setTasksFromServer,
    ],
  )

  return (
    <LocalStateContext.Provider value={value}>
      {children}
    </LocalStateContext.Provider>
  )
}

export const useLocalState = () => {
  const ctx = useContext(LocalStateContext)
  if (!ctx)
    throw new Error('useLocalState must be used within a LocalStateProvider')
  return ctx
}
