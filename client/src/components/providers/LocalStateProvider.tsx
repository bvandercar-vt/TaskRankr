/**
 * @fileoverview Local-first state provider for tasks and settings.
 * Manages localStorage persistence with sync queue for server synchronization.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { omit, pick, toMerged } from 'es-toolkit'

import { toast } from '@/hooks/useToast'
import { DEFAULT_SETTINGS } from '@/lib/constants'
import { debugLog } from '@/lib/debug-logger'
import { createDemoTasks } from '@/lib/demo-tasks'
import {
  type CreateTask,
  SubtaskSortMode,
  type Task,
  TaskStatus,
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
  settings: UserSettings
  syncQueue: SyncOperation[]
  isInitialized: boolean
  hasDemoData: boolean
  createTask: (data: CreateTaskContent) => Task
  updateTask: (id: number, updates: UpdateTaskContent) => Task
  setTaskStatus: (id: number, status: TaskStatus) => Task
  deleteTask: (id: number) => void
  reorderSubtasks: (parentId: number, orderedIds: number[]) => void
  updateSettings: (updates: Partial<UserSettings>) => void
  clearSyncQueue: () => void
  removeSyncOperation: (index: number) => void
  replaceTaskId: (tempId: number, realId: number) => void
  setTasksFromServer: (tasks: Task[]) => void
  setSettingsFromServer: (settings: UserSettings) => void
  deleteDemoData: () => void
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
          result.push({
            ...omit(t, ['subtasks']),
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
            inProgressStartedAt: t.inProgressStartedAt
              ? new Date(t.inProgressStartedAt)
              : null,
          })
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
  children: ReactNode
  shouldSync: boolean
  storageMode: StorageMode
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

  const storageKeys = useMemo(() => getStorageKeys(storageMode), [storageMode])

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
      setTasks(loadedTasks)
    }

    setIsInitialized(true)
  }, [storageKeys, storageMode])

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
            return Object.keys(otherUpdates).length > 0
              ? { ...task, ...otherUpdates }
              : task
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
  }, [])

  const createTask = useCallback(
    (data: CreateTaskContent): Task => {
      const tempId = nextIdRef.current--
      localStorage.setItem(
        storageKeys.nextId,
        JSON.stringify(nextIdRef.current),
      )

      const newTask: Task = {
        id: tempId,
        userId: 'local',
        description: null,
        priority: null,
        ease: null,
        enjoyment: null,
        time: null,
        status:
          settings.autoPinNewTasks && !data.parentId
            ? TaskStatus.PINNED
            : TaskStatus.OPEN,
        inProgressTime: 0,
        inProgressStartedAt: null,
        createdAt: new Date(),
        completedAt: null,
        subtaskSortMode: SubtaskSortMode.INHERIT,
        subtaskOrder: [],
        subtasksShowNumbers: false,
        hidden: false,
        autoHideCompleted: false,
        inheritCompletionState: false,
        ...pick(data, [
          'name',
          'description',
          'priority',
          'ease',
          'enjoyment',
          'time',
          'subtaskSortMode',
          'subtaskOrder',
          'subtasksShowNumbers',
        ]),
        parentId: data.parentId ?? null,
      }

      setTasks((prev) => {
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
            return Object.keys(changes).length > 0
              ? { ...t, ...changes }
              : t
          })
        }
        return updated
      })
      enqueue({ type: SyncOperationType.CREATE_TASK, tempId, data })
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
        setTasks((prev) =>
          prev.map((t) => {
            if (t.parentId !== id) return t
            if (t.status !== TaskStatus.COMPLETED) return t
            return { ...t, hidden: updates.autoHideCompleted as boolean }
          }),
        )
      }

      if (updates.parentId != null && updatedTask) {
        const parent = tasksRef.current.find((t) => t.id === updates.parentId)
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
        const hasIncompleteSubtasks = tasksRef.current.some(
          (t) => t.parentId === id && t.status !== TaskStatus.COMPLETED,
        )
        if (hasIncompleteSubtasks) {
          toast({
            title: 'Cannot complete task',
            description: 'All subtasks must be completed first.',
            variant: 'destructive',
          })
          const existing = tasksRef.current.find((t) => t.id === id)
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
            const parent = tasksRef.current.find(
              (t) => t.id === task.parentId,
            )
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

      if (status === TaskStatus.COMPLETED && updatedTask?.parentId) {
        const parent = tasksRef.current.find(
          (t) => t.id === updatedTask.parentId,
        )
        if (parent?.inheritCompletionState) {
          const siblings = tasksRef.current.filter(
            (t) => t.parentId === parent.id && t.id !== id,
          )
          const allSiblingsCompleted = siblings.every(
            (t) => t.status === TaskStatus.COMPLETED,
          )
          if (allSiblingsCompleted) {
            updateTaskById(parent.id, () => ({
              status: TaskStatus.COMPLETED,
              completedAt: new Date(),
              inProgressStartedAt: null,
            }))
          }
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
        const taskToDelete = prev.find((t) => t.id === id)
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
          if (idsToDelete.has(t.id)) totalTime += t.inProgressTime
        }

        let updated = prev.filter((t) => !idsToDelete.has(t.id))

        if (taskToDelete.parentId) {
          updated = updated.map((t) =>
            t.id === taskToDelete.parentId
              ? {
                  ...t,
                  ...(totalTime > 0
                    ? {
                        inProgressTime: (t.inProgressTime ?? 0) + totalTime,
                      }
                    : {}),
                  subtaskOrder: t.subtaskOrder.filter(
                    (sid) => !idsToDelete.has(sid),
                  ),
                }
              : t,
          )
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
      setTasks(serverTasks)
      nextIdRef.current = -1
      localStorage.setItem(storageKeys.nextId, JSON.stringify(-1))
      debugLog.log('sync', 'setTasksFromServer', { count: serverTasks.length })
    },
    [storageKeys, demoTaskIds],
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
        settings,
        syncQueue,
        isInitialized,
        hasDemoData,
        createTask,
        updateTask,
        setTaskStatus,
        deleteTask,
        reorderSubtasks,
        updateSettings,
        clearSyncQueue,
        removeSyncOperation,
        replaceTaskId,
        setTasksFromServer,
        setSettingsFromServer,
        deleteDemoData,
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
