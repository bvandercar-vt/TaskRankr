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
import { pick } from 'es-toolkit'

import { DEFAULT_SETTINGS } from '@/lib/constants'
import { createDemoTasks } from '@/lib/demo-tasks'
import {
  type CreateTask,
  SubtaskSortMode,
  type Task,
  TaskStatus,
  type TaskWithSubtasks,
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

export type SyncOperationWithArgs =
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
  tasks: TaskWithSubtasks[]
  settings: UserSettings
  syncQueue: SyncOperationWithArgs[]
  isInitialized: boolean
  hasDemoData: boolean
  createTask: (data: CreateTaskContent) => TaskWithSubtasks
  updateTask: (id: number, updates: UpdateTaskContent) => TaskWithSubtasks
  setTaskStatus: (id: number, status: TaskStatus) => TaskWithSubtasks
  deleteTask: (id: number) => void
  reorderSubtasks: (parentId: number, orderedIds: number[]) => void
  updateSettings: (updates: Partial<UserSettings>) => void
  clearSyncQueue: () => void
  removeSyncOperation: (index: number) => void
  replaceTaskId: (tempId: number, realId: number) => void
  setTasksFromServer: (tasks: TaskWithSubtasks[]) => void
  setSettingsFromServer: (settings: UserSettings) => void
  deleteDemoData: () => void
}

const LocalStateContext = createContext<LocalStateContextValue | null>(null)

export enum StorageMode {
  AUTH = 'auth',
  GUEST = 'guest',
}

const getStorageKeys = (mode: StorageMode) => ({
  tasks: `taskrankr-${mode}-tasks`,
  settings: `taskrankr-${mode}-settings`,
  nextId: `taskrankr-${mode}-next-id`,
  syncQueue: `taskrankr-${mode}-sync-queue`,
  demoTaskIds: `taskrankr-${mode}-demo-task-ids`,
})

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    if (key.endsWith('-tasks')) {
      const reviveDates = (tasks: TaskWithSubtasks[]): TaskWithSubtasks[] =>
        tasks.map((t) => ({
          ...t,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
          inProgressStartedAt: t.inProgressStartedAt
            ? new Date(t.inProgressStartedAt)
            : null,
          subtasks: reviveDates(t.subtasks),
        }))
      return reviveDates(parsed) as T
    }
    return parsed
  } catch {
    return fallback
  }
}

const updateTaskInTree = (
  tasks: TaskWithSubtasks[],
  id: number,
  updater: (task: TaskWithSubtasks) => TaskWithSubtasks,
): TaskWithSubtasks[] =>
  tasks.map((task) => {
    if (task.id === id) {
      return updater(task)
    }
    if (task.subtasks.length > 0) {
      return {
        ...task,
        subtasks: updateTaskInTree(task.subtasks, id, updater),
      }
    }
    return task
  })

const deleteTaskFromTree = (
  tasks: TaskWithSubtasks[],
  id: number,
): TaskWithSubtasks[] =>
  tasks
    .filter((task) => task.id !== id)
    .map((task) => ({
      ...task,
      subtasks: deleteTaskFromTree(task.subtasks, id),
    }))

const getTotalTimeFromTask = (task: TaskWithSubtasks): number => {
  let total = task.inProgressTime
  for (const subtask of task.subtasks) {
    total += getTotalTimeFromTask(subtask)
  }
  return total
}

const findTaskInTree = (
  tasks: TaskWithSubtasks[],
  id: number,
): TaskWithSubtasks | undefined => {
  for (const task of tasks) {
    if (task.id === id) return task
    const found = findTaskInTree(task.subtasks, id)
    if (found) return found
  }
  return undefined
}

const addTaskToTree = (
  tasks: TaskWithSubtasks[],
  newTask: TaskWithSubtasks,
  parentId: number | null,
): TaskWithSubtasks[] => {
  if (!parentId) {
    return [...tasks, newTask]
  }
  return tasks.map((task) => {
    if (task.id === parentId) {
      return { ...task, subtasks: [...task.subtasks, newTask] }
    }
    if (task.subtasks.length > 0) {
      return {
        ...task,
        subtasks: addTaskToTree(task.subtasks, newTask, parentId),
      }
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
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>([])
  const [syncQueue, setSyncQueue] = useState<SyncOperationWithArgs[]>([])
  const [demoTaskIds, setDemoTaskIds] = useState<number[]>([])
  const nextIdRef = useRef(-1)

  const storageKeys = useMemo(() => getStorageKeys(storageMode), [storageMode])

  useEffect(() => {
    const loadedSettings = loadFromStorage(
      storageKeys.settings,
      DEFAULT_SETTINGS,
    )
    const loadedTasks = loadFromStorage(storageKeys.tasks, [])
    const loadedNextId = loadFromStorage(storageKeys.nextId, -1)
    const loadedQueue = loadFromStorage<SyncOperationWithArgs[]>(
      storageKeys.syncQueue,
      [],
    )
    const loadedDemoIds = loadFromStorage<number[]>(storageKeys.demoTaskIds, [])

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
      if (storageMode === StorageMode.GUEST) {
        localStorage.removeItem('taskrankr-guest-expanded')
      } else {
        localStorage.removeItem('taskrankr-auth-expanded')
      }
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
    (op: SyncOperationWithArgs) => {
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
    setTasks((prev) => {
      const updated = updateTaskInTree(prev, tempId, (task) => ({
        ...task,
        id: realId,
      }))
      const replaceInOrder = (tasks_: TaskWithSubtasks[]): TaskWithSubtasks[] =>
        tasks_.map((t) => ({
          ...t,
          subtaskOrder: t.subtaskOrder.map((id) =>
            id === tempId ? realId : id,
          ),
          subtasks: replaceInOrder(t.subtasks),
        }))
      return replaceInOrder(updated)
    })
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
    (data: CreateTaskContent): TaskWithSubtasks => {
      const tempId = nextIdRef.current--
      localStorage.setItem(
        storageKeys.nextId,
        JSON.stringify(nextIdRef.current),
      )

      const newTask: TaskWithSubtasks = {
        id: tempId,
        userId: 'local',
        description: null,
        priority: null,
        ease: null,
        enjoyment: null,
        time: null,
        parentId: null,
        status: settings.autoPinNewTasks ? TaskStatus.PINNED : TaskStatus.OPEN,
        inProgressTime: 0,
        inProgressStartedAt: null,
        createdAt: new Date(),
        completedAt: null,
        subtaskSortMode: SubtaskSortMode.INHERIT,
        subtaskOrder: [],
        subtasksShowNumbers: false,
        subtasks: [],
        ...pick(data, [
          'name',
          'description',
          'priority',
          'ease',
          'enjoyment',
          'time',
          'parentId',
          'subtaskSortMode',
          'subtaskOrder',
          'subtasksShowNumbers',
        ]),
      }

      setTasks((prev) => {
        let updated = addTaskToTree(prev, newTask, data.parentId ?? null)
        if (data.parentId) {
          updated = updateTaskInTree(updated, data.parentId, (parent) => {
            if (parent.subtaskSortMode === SubtaskSortMode.MANUAL) {
              return {
                ...parent,
                subtaskOrder: [...parent.subtaskOrder, tempId],
              }
            }
            return parent
          })
        }
        return updated
      })
      enqueue({ type: SyncOperationType.CREATE_TASK, tempId, data })

      return newTask
    },
    [settings.autoPinNewTasks, enqueue, storageKeys],
  )

  const updateTask = useCallback(
    (id: number, updates: UpdateTaskContent): TaskWithSubtasks => {
      let updatedTask: TaskWithSubtasks | undefined
      setTasks((prev) =>
        updateTaskInTree(prev, id, (task) => {
          updatedTask = { ...task, ...updates }
          return updatedTask
        }),
      )
      enqueue({ type: SyncOperationType.UPDATE_TASK, id, data: updates })
      // biome-ignore lint/style/noNonNullAssertion: from Replit. Maybe we should investigate? Throw an error if not defined?
      return updatedTask!
    },
    [enqueue],
  )

  const setTaskStatus = useCallback(
    (id: number, status: TaskStatus): TaskWithSubtasks => {
      let updatedTask: TaskWithSubtasks | undefined
      setTasks((prev) => {
        let newTasks = prev

        if (status === TaskStatus.IN_PROGRESS) {
          newTasks = newTasks.map((t) => {
            if (t.id !== id && t.status === TaskStatus.IN_PROGRESS) {
              return {
                ...t,
                status: TaskStatus.PINNED,
                inProgressStartedAt: null,
              }
            }
            return t
          })
          newTasks = updateTaskInTree(newTasks, id, (task) => {
            updatedTask = {
              ...task,
              status: TaskStatus.IN_PROGRESS,
              inProgressStartedAt: new Date(),
            }
            return updatedTask
          })
        } else if (status === TaskStatus.COMPLETED) {
          newTasks = updateTaskInTree(newTasks, id, (task) => {
            updatedTask = {
              ...task,
              status: TaskStatus.COMPLETED,
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

      enqueue({ type: SyncOperationType.SET_STATUS, id, status })
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
          updated = updateTaskInTree(
            updated,
            taskToDelete.parentId,
            (parent) => ({
              ...parent,
              ...(timeToAccumulate > 0
                ? {
                    inProgressTime:
                      (parent.inProgressTime ?? 0) + timeToAccumulate,
                  }
                : {}),
              subtaskOrder: parent.subtaskOrder.filter((sid) => sid !== id),
            }),
          )
        }

        return deleteTaskFromTree(updated, id)
      })
      enqueue({ type: SyncOperationType.DELETE_TASK, id })
    },
    [enqueue],
  )

  const reorderSubtasks = useCallback(
    (parentId: number, orderedIds: number[]) => {
      setTasks((prev) =>
        updateTaskInTree(prev, parentId, (parent) => ({
          ...parent,
          subtaskOrder: orderedIds,
        })),
      )
      enqueue({
        type: SyncOperationType.REORDER_SUBTASKS,
        parentId,
        orderedIds,
      })
    },
    [enqueue],
  )

  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }))
      enqueue({ type: SyncOperationType.UPDATE_SETTINGS, data: updates })
    },
    [enqueue],
  )

  const setTasksFromServer = useCallback(
    (serverTasks: TaskWithSubtasks[]) => {
      if (serverTasks.length === 0) {
        setTasks((prev) => {
          const hasOnlyDemoTasks =
            prev.length > 0 && prev.every((t) => t.id < 0)
          if (hasOnlyDemoTasks) return prev
          return serverTasks
        })
      } else {
        setTasks(serverTasks)
      }
      nextIdRef.current = -1
      localStorage.setItem(storageKeys.nextId, JSON.stringify(-1))
    },
    [storageKeys],
  )

  const setSettingsFromServer = useCallback((serverSettings: UserSettings) => {
    setSettings(serverSettings)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKeys.demoTaskIds, JSON.stringify(demoTaskIds))
    }
  }, [demoTaskIds, isInitialized, storageKeys])

  const deleteDemoData = useCallback(() => {
    const idsToDelete = new Set(demoTaskIds)
    const filterDemoTasks = (
      taskList: TaskWithSubtasks[],
    ): TaskWithSubtasks[] =>
      taskList
        .filter((task) => !idsToDelete.has(task.id))
        .map((task) => ({
          ...task,
          subtasks: filterDemoTasks(task.subtasks),
        }))
    setTasks((prev) => filterDemoTasks(prev))
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
