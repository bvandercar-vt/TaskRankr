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

import { DEFAULT_SETTINGS } from '@/lib/constants'
import { createDemoTasks } from '@/lib/demo-tasks'
import type {
  CreateTaskRequest,
  TaskResponse,
  TaskStatus,
  UpdateTaskRequest,
  UserSettings,
} from '~/shared/schema'

export type SyncOperation =
  | {
      type: 'create_task'
      tempId: number
      data: Omit<CreateTaskRequest, 'userId'>
    }
  | { type: 'update_task'; id: number; data: UpdateTaskRequest }
  | { type: 'set_status'; id: number; status: TaskStatus }
  | { type: 'delete_task'; id: number }
  | { type: 'update_settings'; data: Partial<UserSettings> }

interface LocalStateContextValue {
  tasks: TaskResponse[]
  settings: UserSettings
  syncQueue: SyncOperation[]
  isInitialized: boolean
  hasDemoData: boolean
  createTask: (data: Omit<CreateTaskRequest, 'userId'>) => TaskResponse
  updateTask: (id: number, updates: UpdateTaskRequest) => TaskResponse
  setTaskStatus: (id: number, status: TaskStatus) => TaskResponse
  deleteTask: (id: number) => void
  updateSettings: (updates: Partial<UserSettings>) => void
  clearSyncQueue: () => void
  removeSyncOperation: (index: number) => void
  replaceTaskId: (tempId: number, realId: number) => void
  setTasksFromServer: (tasks: TaskResponse[]) => void
  setSettingsFromServer: (settings: UserSettings) => void
  resetToDefaults: () => void
  initDemoData: () => void
  deleteDemoData: () => void
}

const LocalStateContext = createContext<LocalStateContextValue | null>(null)

type StorageMode = 'auth' | 'guest'

const getStorageKeys = (mode: StorageMode) => ({
  tasks: `taskrankr-${mode}-tasks`,
  settings: `taskrankr-${mode}-settings`,
  nextId: `taskrankr-${mode}-next-id`,
  syncQueue: `taskrankr-${mode}-sync-queue`,
  demoTaskIds: `taskrankr-${mode}-demo-task-ids`,
})

const DEFAULT_TASKS: TaskResponse[] = []

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    if (key.endsWith('-tasks')) {
      const reviveDates = (tasks: TaskResponse[]): TaskResponse[] =>
        tasks.map((t) => ({
          ...t,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
          inProgressStartedAt: t.inProgressStartedAt
            ? new Date(t.inProgressStartedAt)
            : null,
          subtasks: t.subtasks ? reviveDates(t.subtasks) : [],
        }))
      return reviveDates(parsed) as T
    }
    return parsed
  } catch {
    return fallback
  }
}

const updateTaskInTree = (
  tasks: TaskResponse[],
  id: number,
  updater: (task: TaskResponse) => TaskResponse,
): TaskResponse[] => {
  return tasks.map((task) => {
    if (task.id === id) {
      return updater(task)
    }
    const subtasks = task.subtasks ?? []
    if (subtasks.length > 0) {
      return {
        ...task,
        subtasks: updateTaskInTree(subtasks, id, updater),
      }
    }
    return task
  })
}

const deleteTaskFromTree = (
  tasks: TaskResponse[],
  id: number,
): TaskResponse[] => {
  return tasks
    .filter((task) => task.id !== id)
    .map((task) => ({
      ...task,
      subtasks: deleteTaskFromTree(task.subtasks ?? [], id),
    }))
}

const getTotalTimeFromTask = (task: TaskResponse): number => {
  let total = task.inProgressTime ?? 0
  for (const subtask of task.subtasks ?? []) {
    total += getTotalTimeFromTask(subtask)
  }
  return total
}

const findTaskInTree = (
  tasks: TaskResponse[],
  id: number,
): TaskResponse | undefined => {
  for (const task of tasks) {
    if (task.id === id) return task
    const found = findTaskInTree(task.subtasks ?? [], id)
    if (found) return found
  }
  return undefined
}

const addTaskToTree = (
  tasks: TaskResponse[],
  newTask: TaskResponse,
  parentId: number | null,
): TaskResponse[] => {
  if (!parentId) {
    return [...tasks, newTask]
  }
  return tasks.map((task) => {
    if (task.id === parentId) {
      return { ...task, subtasks: [...(task.subtasks ?? []), newTask] }
    }
    const subtasks = task.subtasks ?? []
    if (subtasks.length > 0) {
      return { ...task, subtasks: addTaskToTree(subtasks, newTask, parentId) }
    }
    return task
  })
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
  const [tasks, setTasks] = useState<TaskResponse[]>(DEFAULT_TASKS)
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([])
  const [demoTaskIds, setDemoTaskIds] = useState<number[]>([])
  const nextIdRef = useRef(-1)

  const storageKeys = useMemo(() => getStorageKeys(storageMode), [storageMode])

  useEffect(() => {
    const loadedSettings = loadFromStorage(
      storageKeys.settings,
      DEFAULT_SETTINGS,
    )
    const loadedTasks = loadFromStorage(storageKeys.tasks, DEFAULT_TASKS)
    const loadedNextId = loadFromStorage(storageKeys.nextId, -1)
    const loadedQueue = loadFromStorage<SyncOperation[]>(
      storageKeys.syncQueue,
      [],
    )
    const loadedDemoIds = loadFromStorage<number[]>(storageKeys.demoTaskIds, [])

    setSettings(loadedSettings)
    nextIdRef.current = loadedNextId
    setSyncQueue(loadedQueue)
    setDemoTaskIds(loadedDemoIds)

    if (storageMode === 'guest' && loadedTasks.length === 0) {
      const demoTasks = createDemoTasks(nextIdRef)
      localStorage.setItem(
        storageKeys.nextId,
        JSON.stringify(nextIdRef.current),
      )
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

  const replaceTaskId = useCallback((tempId: number, realId: number) => {
    setTasks((prev) =>
      updateTaskInTree(prev, tempId, (task) => ({ ...task, id: realId })),
    )
    setSyncQueue((prev) =>
      prev.map((op) => {
        if ('id' in op && op.id === tempId) {
          return { ...op, id: realId }
        }
        return op
      }),
    )
  }, [])

  const createTask = useCallback(
    (data: Omit<CreateTaskRequest, 'userId'>): TaskResponse => {
      const tempId = nextIdRef.current--
      localStorage.setItem(
        storageKeys.nextId,
        JSON.stringify(nextIdRef.current),
      )

      const newTask: TaskResponse = {
        id: tempId,
        userId: 'local',
        name: data.name,
        description: data.description ?? null,
        priority: data.priority ?? 'none',
        ease: data.ease ?? 'none',
        enjoyment: data.enjoyment ?? 'none',
        time: data.time ?? 'none',
        parentId: data.parentId ?? null,
        status: settings.autoPinNewTasks ? 'pinned' : 'open',
        inProgressTime: 0,
        inProgressStartedAt: null,
        createdAt: new Date(),
        completedAt: null,
        subtasks: [],
      }

      setTasks((prev) => addTaskToTree(prev, newTask, data.parentId ?? null))
      enqueue({ type: 'create_task', tempId, data })

      return newTask
    },
    [settings.autoPinNewTasks, enqueue, storageKeys],
  )

  const updateTask = useCallback(
    (id: number, updates: UpdateTaskRequest): TaskResponse => {
      let updatedTask: TaskResponse | undefined
      setTasks((prev) =>
        updateTaskInTree(prev, id, (task) => {
          updatedTask = { ...task, ...updates }
          return updatedTask
        }),
      )
      enqueue({ type: 'update_task', id, data: updates })
      // biome-ignore lint/style/noNonNullAssertion: from Replit. Maybe we should investigate? Throw an error if not defined?
      return updatedTask!
    },
    [enqueue],
  )

  const setTaskStatus = useCallback(
    (id: number, status: TaskStatus): TaskResponse => {
      let updatedTask: TaskResponse | undefined
      setTasks((prev) => {
        let newTasks = prev

        if (status === 'in_progress') {
          newTasks = newTasks.map((t) => {
            if (t.id !== id && t.status === 'in_progress') {
              return {
                ...t,
                status: 'pinned' as const,
                inProgressStartedAt: null,
              }
            }
            return t
          })
          newTasks = updateTaskInTree(newTasks, id, (task) => {
            updatedTask = {
              ...task,
              status: 'in_progress',
              inProgressStartedAt: new Date(),
            }
            return updatedTask
          })
        } else if (status === 'completed') {
          newTasks = updateTaskInTree(newTasks, id, (task) => {
            updatedTask = {
              ...task,
              status: 'completed',
              completedAt: new Date(),
              inProgressStartedAt: null,
            }
            return updatedTask
          })
        } else {
          newTasks = updateTaskInTree(newTasks, id, (task) => {
            updatedTask = { ...task, status, inProgressStartedAt: null }
            return updatedTask
          })
        }

        if (!updatedTask) {
          updatedTask = findTaskInTree(newTasks, id)
        }
        return newTasks
      })

      enqueue({ type: 'set_status', id, status })
      // biome-ignore lint/style/noNonNullAssertion: from Replit. Maybe we should investigate? Throw an error if not defined?
      return updatedTask!
    },
    [enqueue],
  )

  const deleteTask = useCallback(
    (id: number) => {
      setTasks((prev) => {
        const taskToDelete = findTaskInTree(prev, id)
        if (!taskToDelete) return prev

        let updated = prev

        if (taskToDelete.parentId) {
          const timeToAccumulate = getTotalTimeFromTask(taskToDelete)
          if (timeToAccumulate > 0) {
            updated = updateTaskInTree(updated, taskToDelete.parentId, (parent) => ({
              ...parent,
              inProgressTime: (parent.inProgressTime ?? 0) + timeToAccumulate,
            }))
          }
        }

        return deleteTaskFromTree(updated, id)
      })
      enqueue({ type: 'delete_task', id })
    },
    [enqueue],
  )

  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }))
      enqueue({ type: 'update_settings', data: updates })
    },
    [enqueue],
  )

  const setTasksFromServer = useCallback(
    (serverTasks: TaskResponse[]) => {
      setTasks(serverTasks)
      nextIdRef.current = -1
      localStorage.setItem(storageKeys.nextId, JSON.stringify(-1))
    },
    [storageKeys],
  )

  const setSettingsFromServer = useCallback((serverSettings: UserSettings) => {
    setSettings(serverSettings)
  }, [])

  const resetToDefaults = useCallback(() => {
    setTasks(DEFAULT_TASKS)
    setSettings(DEFAULT_SETTINGS)
    setSyncQueue([])
    setDemoTaskIds([])
    nextIdRef.current = -1
    localStorage.removeItem(storageKeys.tasks)
    localStorage.removeItem(storageKeys.settings)
    localStorage.removeItem(storageKeys.syncQueue)
    localStorage.removeItem(storageKeys.nextId)
    localStorage.removeItem(storageKeys.demoTaskIds)
  }, [storageKeys])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKeys.demoTaskIds, JSON.stringify(demoTaskIds))
    }
  }, [demoTaskIds, isInitialized, storageKeys])

  const initDemoData = useCallback(() => {
    const demoTasks = createDemoTasks(nextIdRef)
    localStorage.setItem(storageKeys.nextId, JSON.stringify(nextIdRef.current))
    setDemoTaskIds(demoTasks.map((t) => t.id))
    setTasks((prev) => [...prev, ...demoTasks])
  }, [storageKeys])

  const deleteDemoData = useCallback(() => {
    const idsToDelete = new Set(demoTaskIds)
    const filterDemoTasks = (taskList: TaskResponse[]): TaskResponse[] => {
      return taskList
        .filter((task) => !idsToDelete.has(task.id))
        .map((task) => ({
          ...task,
          subtasks: filterDemoTasks(task.subtasks ?? []),
        }))
    }
    setTasks((prev) => filterDemoTasks(prev))
    setDemoTaskIds([])
  }, [demoTaskIds])

  const hasDemoData =
    demoTaskIds.length > 0 && tasks.some((t) => demoTaskIds.includes(t.id))

  const value = useMemo(
    () => ({
      tasks,
      settings,
      syncQueue,
      isInitialized,
      hasDemoData,
      createTask,
      updateTask,
      setTaskStatus,
      deleteTask,
      updateSettings,
      clearSyncQueue,
      removeSyncOperation,
      replaceTaskId,
      setTasksFromServer,
      setSettingsFromServer,
      resetToDefaults,
      initDemoData,
      deleteDemoData,
    }),
    [
      tasks,
      settings,
      syncQueue,
      isInitialized,
      hasDemoData,
      createTask,
      updateTask,
      setTaskStatus,
      deleteTask,
      updateSettings,
      clearSyncQueue,
      removeSyncOperation,
      replaceTaskId,
      setTasksFromServer,
      setSettingsFromServer,
      resetToDefaults,
      initDemoData,
      deleteDemoData,
    ],
  )

  return (
    <LocalStateContext.Provider value={value}>
      {children}
    </LocalStateContext.Provider>
  )
}

export const useLocalState = () => {
  const context = useContext(LocalStateContext)
  if (!context) {
    throw new Error('useLocalState must be used within a LocalStateProvider')
  }
  return context
}

export const useLocalStateSafe = () => {
  const context = useContext(LocalStateContext)
  return context
}
