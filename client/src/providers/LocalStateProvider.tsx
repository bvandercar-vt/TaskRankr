/**
 * @fileoverview Local-first state provider for tasks and settings.
 * Manages localStorage persistence with sync queue for server synchronization.
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
import { toMerged } from 'es-toolkit'
import type { z } from 'zod'

import { toast } from '@/hooks/useToast'
import { DEFAULT_SETTINGS } from '@/lib/constants'
import { debugLog } from '@/lib/debug-logger'
import { createDemoTasks } from '@/lib/demo-tasks'
import {
  getChildrenLatestCompletedAt,
  getDirectSubtasks,
  getHasIncompleteSubtasks,
  getTaskById,
  updateTaskInList,
} from '@/lib/task-utils'
import {
  allRankFieldsNull,
  type CreateTask,
  SubtaskSortMode,
  type Task,
  TaskStatus,
  taskSchema,
  type UpdateTask,
  type UserSettings,
} from '~/shared/schema'

export type CreateTaskContent = Omit<CreateTask, 'userId' | 'id'>
export type UpdateTaskContent = Omit<UpdateTask, 'id'>
export type MutateTaskContent = CreateTaskContent | UpdateTaskContent
export type DeleteTaskArgs = Pick<Task, 'id' | 'name'>

export enum SyncOperationType {
  CREATE_TASK = 'create_task',
  UPDATE_TASK = 'update_task',
  SET_STATUS = 'set_status',
  DELETE_TASK = 'delete_task',
  UPDATE_SETTINGS = 'update_settings',
  REORDER_SUBTASKS = 'reorder_subtasks',
}

export type SyncOperation =
  | {
      type: SyncOperationType.CREATE_TASK
      tempId: number
      data: CreateTaskContent
    }
  | { type: SyncOperationType.UPDATE_TASK; id: number; data: UpdateTaskContent }
  | { type: SyncOperationType.SET_STATUS; id: number; status: TaskStatus }
  | { type: SyncOperationType.DELETE_TASK; id: number }
  | { type: SyncOperationType.UPDATE_SETTINGS; data: Partial<UserSettings> }
  | {
      type: SyncOperationType.REORDER_SUBTASKS
      parentId: number
      orderedIds: number[]
    }

interface LocalStateContextValue {
  tasks: Task[]
  /** `tasks` merged with the in-memory draft session overlay. Drafts have
   *  negative IDs and are NOT persisted to localStorage or enqueued for sync. */
  tasksWithDrafts: Task[]
  /** Set of task IDs currently in the draft session. */
  draftTaskIds: Set<number>
  /** Number of real tasks that have been reassigned to a draft parent during
   *  the session. Used by the cancel-confirmation dialog. */
  draftAssignmentCount: number
  hasDraftSession: boolean
  settings: UserSettings
  syncQueue: SyncOperation[]
  isInitialized: boolean
  hasDemoData: boolean
  createTask: (data: CreateTaskContent) => Task
  updateTask: (id: number, updates: UpdateTaskContent) => Task
  setTaskStatus: (id: number, status: TaskStatus) => Task
  deleteTask: (id: number) => void
  reorderSubtasks: (parentId: number, orderedIds: number[]) => void
  /** Create a draft (in-memory) task. Returns the draft Task with a
   *  negative ID. Does not persist or enqueue. */
  createDraftTask: (data: CreateTaskContent) => Task
  /** Reparent an existing real task to a draft parent for the duration of the
   *  session. Reverts on `discardDraftSession`. */
  assignDraftSubtask: (realTaskId: number, draftParentId: number) => void
  /** Promote all drafts to real tasks (enqueues CREATE_TASK + UPDATE_TASK
   *  ops) and clears the session. */
  commitDraftSession: () => void
  /** Drop all drafts and revert assignments. Nothing was ever persisted. */
  discardDraftSession: () => void
  updateSettings: (updates: Partial<UserSettings>) => void
  clearSyncQueue: () => void
  removeSyncOperation: (index: number) => void
  replaceTaskId: (tempId: number, realId: number) => void
  setTasksFromServer: (tasks: Task[]) => void
  setSettingsFromServer: (settings: UserSettings) => void
  deleteDemoData: () => void
  subscribeToIdReplacement: (
    cb: (tempId: number, realId: number) => void,
  ) => () => void
}

const LocalStateContext = createContext<LocalStateContextValue | null>(null)

export enum StorageMode {
  AUTH = 'auth',
  GUEST = 'guest',
}

export const getStorageKeys = (mode: StorageMode) =>
  ({
    tasks: `taskrankr-${mode}-tasks`,
    settings: `taskrankr-${mode}-settings`,
    nextId: `taskrankr-${mode}-next-id`,
    syncQueue: `taskrankr-${mode}-sync-queue`,
    demoTaskIds: `taskrankr-${mode}-demo-task-ids`,
    expanded: `taskrankr-${mode}-expanded`,
  }) as const

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    if (key.endsWith('-tasks')) {
      const flatten = (tasks: (Task & { subtasks?: Task[] })[]): Task[] => {
        const result: Task[] = []
        for (const t of tasks) {
          result.push(taskSchema.parse(t))
          if (t.subtasks?.length) {
            result.push(...flatten(t.subtasks))
          }
        }
        return result
      }
      return flatten(parsed) as T
    }
    return parsed
  } catch {
    return fallback
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
          ? (getTaskById(updated, parent.parentId)?.autoHideCompleted ?? false)
          : false

        updated = updateTaskInList(updated, parent.id, (t) => ({
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
        updated = updateTaskInList(updated, parent.id, (t) => ({
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [tasks, setTasks] = useState<Task[]>([])
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([])
  const [demoTaskIds, setDemoTaskIds] = useState<number[]>([])
  const nextIdRef = useRef(-1)
  const tasksRef = useRef<Task[]>([])
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
        if (shouldSync) {
          setSyncQueue((prev) => [
            ...prev,
            ...corrections.map(
              (c) =>
                ({
                  type: SyncOperationType.SET_STATUS,
                  id: c.id,
                  status: c.status,
                }) as const,
            ),
          ])
        }
      }
    },
    [shouldSync],
  )

  useEffect(() => {
    const loadedSettings: UserSettings = toMerged(
      DEFAULT_SETTINGS,
      loadFromStorage<UserSettings>(storageKeys.settings, DEFAULT_SETTINGS),
    )
    const loadedTasks: Task[] = loadFromStorage<Task[]>(storageKeys.tasks, [])
    const loadedNextId: number = loadFromStorage<number>(storageKeys.nextId, -1)
    const loadedQueue: SyncOperation[] = loadFromStorage<SyncOperation[]>(
      storageKeys.syncQueue,
      [],
    )
    const loadedDemoIds: number[] = loadFromStorage<number[]>(
      storageKeys.demoTaskIds,
      [],
    )

    setSettings(loadedSettings)
    nextIdRef.current = loadedNextId
    setSyncQueue(loadedQueue)
    setDemoTaskIds(loadedDemoIds)

    if (loadedTasks.length === 0) {
      const demoTasks = createDemoTasks(nextIdRef)
      localStorage.setItem(
        storageKeys.nextId,
        JSON.stringify(nextIdRef.current),
      )

      localStorage.removeItem(getStorageKeys(storageMode).expanded)
      setDemoTaskIds(demoTasks.map((t) => t.id))
      setTasks(demoTasks)
    } else {
      reconcileAndSetTasks(loadedTasks, 'init')
    }

    setIsInitialized(true)
  }, [storageKeys, storageMode, reconcileAndSetTasks])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks))
    }
  }, [tasks, isInitialized, storageKeys])

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKeys.settings, JSON.stringify(settings))
    }
  }, [settings, isInitialized, storageKeys])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKeys.syncQueue, JSON.stringify(syncQueue))
    }
  }, [syncQueue, isInitialized, storageKeys])

  const enqueue = useCallback(
    (op: SyncOperation) => {
      if (shouldSync) {
        setSyncQueue((prev) => [...prev, op])
      }
    },
    [shouldSync],
  )

  // ---------------------------------------------------------------------------
  // Draft session state
  //
  // Drafts are in-memory-only Task records used by the TaskForm dialog so that
  // newly-added subtasks render through `useTasks()` exactly like persisted
  // subtasks (drag/edit/delete/sort all work uniformly), without writing
  // anything to localStorage or the sync queue until the user commits the
  // root form. On commit, drafts are promoted to real tasks via the regular
  // create/update path. On discard, drafts are simply dropped.
  // ---------------------------------------------------------------------------
  const [draftTasks, setDraftTasks] = useState<Task[]>([])
  // realTaskId -> { newParentId: draftId, originalParentId: number | null }
  const [draftAssignedParents, setDraftAssignedParents] = useState<
    Map<number, { newParentId: number; originalParentId: number | null }>
  >(new Map())
  // realParentId -> overridden subtaskOrder for the session
  const [draftSubtaskOrderOverrides, setDraftSubtaskOrderOverrides] = useState<
    Map<number, number[]>
  >(new Map())
  // Dedicated id ref for drafts so we don't burn or persist the real nextIdRef.
  // Drafts use very-negative IDs to avoid colliding with sync-pending temp ids.
  const draftIdRef = useRef(-100_000_000)

  const draftTaskIds = useMemo(
    () => new Set(draftTasks.map((t) => t.id)),
    [draftTasks],
  )
  const isDraftId = useCallback(
    (id: number) => draftTaskIds.has(id),
    [draftTaskIds],
  )
  const hasDraftSession =
    draftTasks.length > 0 ||
    draftAssignedParents.size > 0 ||
    draftSubtaskOrderOverrides.size > 0

  const tasksWithDrafts = useMemo<Task[]>(() => {
    if (!hasDraftSession) return tasks

    // Apply assignment + order overrides to real tasks.
    const overridden = tasks.map((t) => {
      let next = t
      const assignment = draftAssignedParents.get(t.id)
      if (assignment) next = { ...next, parentId: assignment.newParentId }
      const orderOverride = draftSubtaskOrderOverrides.get(t.id)
      if (orderOverride) next = { ...next, subtaskOrder: orderOverride }
      return next
    })

    // For real parents that have draft children but no explicit order
    // override, append draft child IDs to subtaskOrder when MANUAL so drag
    // handles render in a stable order.
    const draftChildrenByRealParent = new Map<number, number[]>()
    for (const d of draftTasks) {
      if (d.parentId != null && d.parentId >= 0) {
        const arr = draftChildrenByRealParent.get(d.parentId) ?? []
        arr.push(d.id)
        draftChildrenByRealParent.set(d.parentId, arr)
      }
    }
    const augmented = overridden.map((t) => {
      const additions = draftChildrenByRealParent.get(t.id)
      if (
        additions &&
        !draftSubtaskOrderOverrides.has(t.id) &&
        t.subtaskSortMode === SubtaskSortMode.MANUAL
      ) {
        return { ...t, subtaskOrder: [...t.subtaskOrder, ...additions] }
      }
      return t
    })

    return [...augmented, ...draftTasks]
  }, [
    hasDraftSession,
    tasks,
    draftTasks,
    draftAssignedParents,
    draftSubtaskOrderOverrides,
  ])

  const createDraftTask = useCallback((data: CreateTaskContent): Task => {
    const tempId = draftIdRef.current--
    const newTask: Task = taskSchema.parse({
      ...allRankFieldsNull,
      ...data,
      id: tempId,
      userId: 'local',
      status: data.status ?? TaskStatus.OPEN,
    } satisfies z.input<typeof taskSchema>)

    setDraftTasks((prev) => {
      let updated = [...prev, newTask]
      if (data.parentId != null) {
        // If parent is itself a draft and MANUAL, append to its subtaskOrder.
        updated = updated.map((t) => {
          if (t.id !== data.parentId) return t
          if (t.subtaskSortMode === SubtaskSortMode.MANUAL) {
            return { ...t, subtaskOrder: [...t.subtaskOrder, tempId] }
          }
          return t
        })
      }
      return updated
    })
    debugLog.log('task', 'createDraft', {
      tempId,
      name: data.name,
      parentId: data.parentId,
    })
    return newTask
  }, [])

  const updateDraftTask = useCallback(
    (id: number, updates: UpdateTaskContent): Task => {
      let updated: Task | undefined
      setDraftTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          updated = { ...t, ...updates }
          return updated
        }),
      )
      // biome-ignore lint/style/noNonNullAssertion: id was verified by caller as a draft
      return updated!
    },
    [],
  )

  const deleteDraftTask = useCallback((id: number) => {
    setDraftTasks((prev) => {
      const idsToDelete = new Set<number>()
      const collect = (pid: number) => {
        idsToDelete.add(pid)
        for (const t of prev) {
          if (t.parentId === pid) collect(t.id)
        }
      }
      collect(id)

      // Drop any assignment overrides whose new parent is being deleted, and
      // drop any subtaskOrder overrides for parents being deleted.
      setDraftAssignedParents((prevAssigned) => {
        if (prevAssigned.size === 0) return prevAssigned
        let changed = false
        const next = new Map(prevAssigned)
        prevAssigned.forEach((info, taskId) => {
          if (idsToDelete.has(info.newParentId)) {
            next.delete(taskId)
            changed = true
          }
        })
        return changed ? next : prevAssigned
      })
      setDraftSubtaskOrderOverrides((prevOverrides) => {
        if (prevOverrides.size === 0) return prevOverrides
        let changed = false
        const next = new Map(prevOverrides)
        prevOverrides.forEach((_v, pid) => {
          if (idsToDelete.has(pid)) {
            next.delete(pid)
            changed = true
          }
        })
        // Strip deleted ids out of remaining overrides
        Array.from(next.entries()).forEach(([pid, order]) => {
          const filtered = order.filter((sid: number) => !idsToDelete.has(sid))
          if (filtered.length !== order.length) {
            next.set(pid, filtered)
            changed = true
          }
        })
        return changed ? next : prevOverrides
      })

      return prev
        .filter((t) => !idsToDelete.has(t.id))
        .map((t) => ({
          ...t,
          subtaskOrder: t.subtaskOrder.filter((sid) => !idsToDelete.has(sid)),
        }))
    })
    debugLog.log('task', 'deleteDraft', { id })
  }, [])

  const reorderDraftSubtasks = useCallback(
    (parentId: number, orderedIds: number[]) => {
      setDraftTasks((prev) =>
        prev.map((t) =>
          t.id === parentId ? { ...t, subtaskOrder: orderedIds } : t,
        ),
      )
    },
    [],
  )

  const assignDraftSubtask = useCallback(
    (realTaskId: number, draftParentId: number) => {
      const realTask = getTaskById(tasksRef.current, realTaskId)
      if (!realTask) return
      setDraftAssignedParents((prev) => {
        const next = new Map(prev)
        // Preserve the very first originalParentId we observed for this task
        // so multiple reassigns within the session still revert correctly.
        const existing = prev.get(realTaskId)
        next.set(realTaskId, {
          newParentId: draftParentId,
          originalParentId: existing
            ? existing.originalParentId
            : realTask.parentId,
        })
        return next
      })
      // If the draft parent is MANUAL, append the assigned task to its order.
      setDraftTasks((prev) =>
        prev.map((t) => {
          if (t.id !== draftParentId) return t
          if (t.subtaskSortMode !== SubtaskSortMode.MANUAL) return t
          if (t.subtaskOrder.includes(realTaskId)) return t
          return { ...t, subtaskOrder: [...t.subtaskOrder, realTaskId] }
        }),
      )
      debugLog.log('task', 'assignDraftSubtask', {
        realTaskId,
        draftParentId,
      })
    },
    [],
  )

  const discardDraftSession = useCallback(() => {
    setDraftTasks([])
    setDraftAssignedParents(new Map())
    setDraftSubtaskOrderOverrides(new Map())
    draftIdRef.current = -100_000_000
    debugLog.log('task', 'discardDraftSession', {})
  }, [])

  const clearSyncQueue = useCallback(() => {
    setSyncQueue([])
  }, [])

  const removeSyncOperation = useCallback((index: number) => {
    setSyncQueue((prev) => prev.filter((_, i) => i !== index))
  }, [])

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

  const replaceTaskId = useCallback((tempId: number, realId: number) => {
    setTasks((prev) =>
      prev.map((t) => ({
        ...(t.id === tempId ? { ...t, id: realId } : t),
        parentId: t.parentId === tempId ? realId : t.parentId,
        subtaskOrder: t.subtaskOrder.map((sid) =>
          sid === tempId ? realId : sid,
        ),
      })),
    )
    setSyncQueue((prev) =>
      prev.map((op) => {
        if (op.type === SyncOperationType.CREATE_TASK) {
          if (op.tempId === tempId) return { ...op, tempId: realId }
          if (op.data.parentId === tempId)
            return { ...op, data: { ...op.data, parentId: realId } }
          return op
        }
        if (op.type === SyncOperationType.REORDER_SUBTASKS) {
          return {
            ...op,
            parentId: op.parentId === tempId ? realId : op.parentId,
            orderedIds: op.orderedIds.map((oid) =>
              oid === tempId ? realId : oid,
            ),
          }
        }
        if ('id' in op && op.id === tempId) {
          return { ...op, id: realId }
        }
        return op
      }),
    )
    idReplacedCallbacks.current.forEach((cb) => {
      cb(tempId, realId)
    })
  }, [])

  const createTask = useCallback(
    (data: CreateTaskContent): Task => {
      const tempId = nextIdRef.current--
      localStorage.setItem(
        storageKeys.nextId,
        JSON.stringify(nextIdRef.current),
      )

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
        const parent = data.parentId
          ? getTaskById(prev, data.parentId)
          : undefined
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
      if (isDraftId(id)) {
        return updateDraftTask(id, updates)
      }
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
        const parent = getTaskById(tasksRef.current, updates.parentId)
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
    [enqueue, updateTaskById, isDraftId, updateDraftTask],
  )

  const setTaskStatus = useCallback(
    (id: number, status: TaskStatus): Task => {
      if (isDraftId(id)) {
        const next: Partial<Task> =
          status === TaskStatus.IN_PROGRESS
            ? { status, inProgressStartedAt: new Date() }
            : status === TaskStatus.COMPLETED
              ? {
                  status,
                  completedAt: new Date(),
                  inProgressStartedAt: null,
                }
              : { status, inProgressStartedAt: null }
        return updateDraftTask(id, next as UpdateTaskContent)
      }
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
          const existing = getTaskById(tasksRef.current, id)
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
            const parent = getTaskById(tasksRef.current, task.parentId)
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
            const parent = getTaskById(updated, currentParentId)
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
              const grandparent = getTaskById(updated, parent.parentId)
              if (grandparent?.autoHideCompleted) {
                parentUpdate.hidden = true
              }
            }

            updated = updateTaskInList(updated, parent.id, (t) => ({
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
            const parent = getTaskById(updated, currentParentId)
            if (!parent?.inheritCompletionState) break
            if (parent.status !== TaskStatus.COMPLETED) break

            updated = updateTaskInList(updated, parent.id, (t) => ({
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
    [enqueue, updateTaskById, isDraftId, updateDraftTask],
  )

  const deleteTask = useCallback(
    (id: number) => {
      if (isDraftId(id)) {
        deleteDraftTask(id)
        return
      }
      // If the user deletes a real task that was assigned during the session,
      // drop the assignment so we don't try to UPDATE_TASK it on commit.
      setDraftAssignedParents((prev) => {
        if (!prev.has(id)) return prev
        const next = new Map(prev)
        next.delete(id)
        return next
      })
      setTasks((prev) => {
        const taskToDelete = getTaskById(prev, id)
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

        let updated = prev.filter((t) => !idsToDelete.has(t.id))

        if (taskToDelete.parentId) {
          updated = updateTaskInList(updated, taskToDelete.parentId, (t) => ({
            ...t,
            ...(totalTime > 0
              ? {
                  timeSpent: (t.timeSpent ?? 0) + totalTime,
                }
              : {}),
            subtaskOrder: t.subtaskOrder.filter((sid) => !idsToDelete.has(sid)),
          }))
        }

        return updated
      })
      enqueue({ type: SyncOperationType.DELETE_TASK, id })
      debugLog.log('task', 'delete', { id })
    },
    [enqueue, isDraftId, deleteDraftTask],
  )

  const reorderSubtasks = useCallback(
    (parentId: number, orderedIds: number[]) => {
      if (isDraftId(parentId)) {
        reorderDraftSubtasks(parentId, orderedIds)
        return
      }
      // Real parent: if any draft children/assignments are involved (i.e. we
      // are inside a draft session), park the new order in the override map
      // so it is not persisted/synced until commit. Otherwise, reorder
      // normally.
      if (
        hasDraftSession &&
        orderedIds.some((id) => isDraftId(id) || draftAssignedParents.has(id))
      ) {
        setDraftSubtaskOrderOverrides((prev) => {
          const next = new Map(prev)
          next.set(parentId, orderedIds)
          return next
        })
        debugLog.log('task', 'reorderSubtasks:draftOverride', {
          parentId,
          orderedIds,
        })
        return
      }
      updateTaskById(parentId, () => ({ subtaskOrder: orderedIds }))
      enqueue({
        type: SyncOperationType.REORDER_SUBTASKS,
        parentId,
        orderedIds,
      })
      debugLog.log('task', 'reorderSubtasks', { parentId, orderedIds })
    },
    [
      enqueue,
      updateTaskById,
      isDraftId,
      reorderDraftSubtasks,
      hasDraftSession,
      draftAssignedParents,
    ],
  )

  // ---------------------------------------------------------------------------
  // commitDraftSession: promote all in-memory drafts to real tasks.
  //
  // Walk drafts parent-first so each child can resolve its parentId from the
  // freshly minted real id. The existing `createTask` mints its own temp id
  // (separate from the draft id), so we maintain a draft.id -> newTask.id
  // map and translate parentId / order references through it.
  // ---------------------------------------------------------------------------
  const commitDraftSession = useCallback(() => {
    if (
      draftTasks.length === 0 &&
      draftAssignedParents.size === 0 &&
      draftSubtaskOrderOverrides.size === 0
    ) {
      return
    }

    debugLog.log('task', 'commitDraftSession:start', {
      draftCount: draftTasks.length,
      assignmentCount: draftAssignedParents.size,
      overrideCount: draftSubtaskOrderOverrides.size,
    })

    const idMap = new Map<number, number>()
    const resolve = (id: number) => idMap.get(id) ?? id

    // Topological sort: parents before children.
    const ordered: Task[] = []
    const remaining = new Set(draftTasks.map((t) => t.id))
    const byId = new Map(draftTasks.map((t) => [t.id, t]))
    while (remaining.size > 0) {
      let progressed = false
      Array.from(remaining).forEach((id) => {
        const t = byId.get(id)
        if (!t) return
        const parentIsDraft = t.parentId != null && remaining.has(t.parentId)
        if (!parentIsDraft) {
          ordered.push(t)
          remaining.delete(id)
          progressed = true
        }
      })
      if (!progressed) {
        // Cycle (shouldn't happen) — bail out by appending the rest in order.
        Array.from(remaining).forEach((id) => {
          const t = byId.get(id)
          if (t) ordered.push(t)
        })
        break
      }
    }

    for (const draft of ordered) {
      const created = createTask({
        name: draft.name,
        description: draft.description,
        status: draft.status,
        priority: draft.priority,
        ease: draft.ease,
        enjoyment: draft.enjoyment,
        time: draft.time,
        timeSpent: draft.timeSpent,
        parentId:
          draft.parentId != null ? resolve(draft.parentId) : draft.parentId,
        subtaskSortMode: draft.subtaskSortMode,
        subtasksShowNumbers: draft.subtasksShowNumbers,
        autoHideCompleted: draft.autoHideCompleted,
        inheritCompletionState: draft.inheritCompletionState,
        hidden: draft.hidden,
      })
      idMap.set(draft.id, created.id)
    }

    // Bypass the public mutators' draft-routing for the rest of commit:
    // hasDraftSession is still true here (state setters batch), so calls
    // through reorderSubtasks/updateTask might re-park into draft overrides.
    const directReorder = (parentId: number, orderedIds: number[]) => {
      updateTaskById(parentId, () => ({ subtaskOrder: orderedIds }))
      enqueue({
        type: SyncOperationType.REORDER_SUBTASKS,
        parentId,
        orderedIds,
      })
    }
    const directUpdate = (id: number, updates: UpdateTaskContent) => {
      updateTaskById(id, () => updates)
      enqueue({ type: SyncOperationType.UPDATE_TASK, id, data: updates })
    }

    // For MANUAL draft parents whose user-defined order differs from the
    // append-order produced by sequential createTask calls, lock in the order.
    for (const draft of ordered) {
      if (draft.subtaskSortMode !== SubtaskSortMode.MANUAL) continue
      if (draft.subtaskOrder.length === 0) continue
      const realId = resolve(draft.id)
      const resolvedOrder = draft.subtaskOrder.map(resolve)
      directReorder(realId, resolvedOrder)
    }

    // Apply assignments: real task -> resolved (draft) parent.
    draftAssignedParents.forEach((info, realTaskId) => {
      directUpdate(realTaskId, { parentId: resolve(info.newParentId) })
    })

    // Apply real-parent subtaskOrder overrides (resolving any draft ids).
    draftSubtaskOrderOverrides.forEach((order, realParentId) => {
      directReorder(realParentId, order.map(resolve))
    })

    discardDraftSession()
    debugLog.log('task', 'commitDraftSession:complete', { mapped: idMap.size })
  }, [
    draftTasks,
    draftAssignedParents,
    draftSubtaskOrderOverrides,
    createTask,
    updateTaskById,
    enqueue,
    discardDraftSession,
  ])

  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }))
      enqueue({ type: SyncOperationType.UPDATE_SETTINGS, data: updates })
      debugLog.log('settings', 'update', updates)
    },
    [enqueue],
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
        setSyncQueue((prev) => [
          ...prev,
          ...orphaned.map(
            (t) =>
              ({
                type: SyncOperationType.UPDATE_TASK,
                id: t.id,
                data: { parentId: null },
              }) as const,
          ),
        ])
      }

      reconcileAndSetTasks(sanitized, 'fromServer')
      nextIdRef.current = -1
      localStorage.setItem(storageKeys.nextId, JSON.stringify(-1))
      debugLog.log('sync', 'setTasksFromServer', { count: serverTasks.length })
    },
    [storageKeys, demoTaskIds, reconcileAndSetTasks],
  )

  const setSettingsFromServer = useCallback((serverSettings: UserSettings) => {
    setSettings(serverSettings)
    debugLog.log('sync', 'setSettingsFromServer', serverSettings)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKeys.demoTaskIds, JSON.stringify(demoTaskIds))
    }
  }, [demoTaskIds, isInitialized, storageKeys])

  const deleteDemoData = useCallback(() => {
    const idsToDelete = new Set(demoTaskIds)
    setTasks((prev) => prev.filter((task) => !idsToDelete.has(task.id)))
    setDemoTaskIds([])
  }, [demoTaskIds])

  const hasDemoData =
    demoTaskIds.length > 0 && tasks.some((t) => demoTaskIds.includes(t.id))

  return (
    <LocalStateContext.Provider
      value={{
        tasks,
        tasksWithDrafts,
        draftTaskIds,
        draftAssignmentCount: draftAssignedParents.size,
        hasDraftSession,
        settings,
        syncQueue,
        isInitialized,
        hasDemoData,
        createTask,
        updateTask,
        setTaskStatus,
        deleteTask,
        reorderSubtasks,
        createDraftTask,
        assignDraftSubtask,
        commitDraftSession,
        discardDraftSession,
        updateSettings,
        clearSyncQueue,
        removeSyncOperation,
        replaceTaskId,
        setTasksFromServer,
        setSettingsFromServer,
        deleteDemoData,
        subscribeToIdReplacement,
      }}
    >
      {children}
    </LocalStateContext.Provider>
  )
}

export const useLocalStateSafe = () => useContext(LocalStateContext)

export const useLocalState = () => {
  const context = useLocalStateSafe()
  if (!context) {
    throw new Error('useLocalState must be used within a LocalStateProvider')
  }
  return context
}
