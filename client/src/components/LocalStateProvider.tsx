import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type {
  CreateTaskRequest,
  TaskResponse,
  TaskStatus,
  UpdateTaskRequest,
} from '~/shared/schema'
import type { AppSettings } from '@/hooks/use-settings'

export type SyncOperation =
  | { type: 'create_task'; tempId: number; data: Omit<CreateTaskRequest, 'userId'> }
  | { type: 'update_task'; id: number; data: UpdateTaskRequest }
  | { type: 'set_status'; id: number; status: TaskStatus }
  | { type: 'delete_task'; id: number }
  | { type: 'update_settings'; data: Partial<AppSettings> }

interface LocalStateContextValue {
  tasks: TaskResponse[]
  settings: AppSettings
  syncQueue: SyncOperation[]
  isInitialized: boolean
  hasDemoData: boolean
  createTask: (data: Omit<CreateTaskRequest, 'userId'>) => TaskResponse
  updateTask: (id: number, updates: UpdateTaskRequest) => TaskResponse
  setTaskStatus: (id: number, status: TaskStatus) => TaskResponse
  deleteTask: (id: number) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  clearSyncQueue: () => void
  removeSyncOperation: (index: number) => void
  replaceTaskId: (tempId: number, realId: number) => void
  setTasksFromServer: (tasks: TaskResponse[]) => void
  setSettingsFromServer: (settings: AppSettings) => void
  resetToDefaults: () => void
  initDemoData: () => void
  deleteDemoData: () => void
}

const LocalStateContext = createContext<LocalStateContextValue | null>(null)

const STORAGE_KEYS = {
  tasks: 'taskrankr-local-tasks',
  settings: 'taskrankr-local-settings',
  nextId: 'taskrankr-local-next-id',
  syncQueue: 'taskrankr-sync-queue',
}

const DEFAULT_SETTINGS: AppSettings = {
  userId: 'local',
  autoPinNewTasks: true,
  enableInProgressTime: true,
  alwaysSortPinnedByPriority: true,
  sortBy: 'priority',
  priorityVisible: true,
  priorityRequired: true,
  easeVisible: true,
  easeRequired: false,
  enjoymentVisible: true,
  enjoymentRequired: false,
  timeVisible: true,
  timeRequired: false,
}

const DEFAULT_TASKS: TaskResponse[] = []

const DEMO_TASK_IDS_KEY = 'taskrankr-demo-task-ids'

const createDemoTasks = (nextIdRef: { current: number }): TaskResponse[] => {
  const now = new Date()
  
  const getNextId = () => {
    const id = nextIdRef.current--
    return id
  }
  
  const demoTasks: TaskResponse[] = [
    {
      id: getNextId(),
      userId: 'local',
      name: 'Try creating your first task',
      description: 'Tap the + button in the bottom right corner to create a new task.',
      priority: 'high',
      ease: 'easy',
      enjoyment: 'medium',
      time: 'low',
      parentId: null,
      status: 'pinned',
      inProgressTime: 0,
      inProgressStartedAt: null,
      createdAt: new Date(now.getTime() - 60000),
      completedAt: null,
      subtasks: [],
    },
    {
      id: getNextId(),
      userId: 'local',
      name: 'Explore task attributes',
      description: 'Each task can have Priority, Ease, Enjoyment, and Time ratings. Use the sort buttons at the top to organize your tasks.',
      priority: 'medium',
      ease: 'easy',
      enjoyment: 'high',
      time: 'low',
      parentId: null,
      status: 'open',
      inProgressTime: 0,
      inProgressStartedAt: null,
      createdAt: new Date(now.getTime() - 120000),
      completedAt: null,
      subtasks: [],
    },
    {
      id: getNextId(),
      userId: 'local',
      name: 'Long-press for status options',
      description: 'Long-press any task to change its status: Open, In Progress, Pinned, or Completed.',
      priority: 'medium',
      ease: 'easy',
      enjoyment: 'medium',
      time: 'lowest',
      parentId: null,
      status: 'open',
      inProgressTime: 0,
      inProgressStartedAt: null,
      createdAt: new Date(now.getTime() - 180000),
      completedAt: null,
      subtasks: [],
    },
    {
      id: getNextId(),
      userId: 'local',
      name: 'Create nested subtasks',
      description: 'When editing a task, you can add subtasks to break down complex work.',
      priority: 'low',
      ease: 'medium',
      enjoyment: 'medium',
      time: 'medium',
      parentId: null,
      status: 'open',
      inProgressTime: 0,
      inProgressStartedAt: null,
      createdAt: new Date(now.getTime() - 240000),
      completedAt: null,
      subtasks: [],
    },
  ]
  
  return demoTasks
}

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    if (key === STORAGE_KEYS.tasks) {
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
}

export const LocalStateProvider = ({
  children,
  shouldSync,
}: LocalStateProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [tasks, setTasks] = useState<TaskResponse[]>(DEFAULT_TASKS)
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([])
  const [demoTaskIds, setDemoTaskIds] = useState<number[]>([])
  const nextIdRef = useRef(-1)

  useEffect(() => {
    const loadedSettings = loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
    const loadedTasks = loadFromStorage(STORAGE_KEYS.tasks, DEFAULT_TASKS)
    const loadedNextId = loadFromStorage(STORAGE_KEYS.nextId, -1)
    const loadedQueue = loadFromStorage<SyncOperation[]>(STORAGE_KEYS.syncQueue, [])
    const loadedDemoIds = loadFromStorage<number[]>(DEMO_TASK_IDS_KEY, [])

    setSettings(loadedSettings)
    setTasks(loadedTasks)
    setSyncQueue(loadedQueue)
    setDemoTaskIds(loadedDemoIds)
    nextIdRef.current = loadedNextId
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
    }
  }, [tasks, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
    }
  }, [settings, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.syncQueue, JSON.stringify(syncQueue))
    }
  }, [syncQueue, isInitialized])

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
      localStorage.setItem(STORAGE_KEYS.nextId, JSON.stringify(nextIdRef.current))

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
    [settings.autoPinNewTasks, enqueue],
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
              return { ...t, status: 'pinned' as const, inProgressStartedAt: null }
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
      return updatedTask!
    },
    [enqueue],
  )

  const deleteTask = useCallback(
    (id: number) => {
      setTasks((prev) => deleteTaskFromTree(prev, id))
      enqueue({ type: 'delete_task', id })
    },
    [enqueue],
  )

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }))
      enqueue({ type: 'update_settings', data: updates })
    },
    [enqueue],
  )

  const setTasksFromServer = useCallback((serverTasks: TaskResponse[]) => {
    setTasks(serverTasks)
    nextIdRef.current = -1
    localStorage.setItem(STORAGE_KEYS.nextId, JSON.stringify(-1))
  }, [])

  const setSettingsFromServer = useCallback((serverSettings: AppSettings) => {
    setSettings(serverSettings)
  }, [])

  const resetToDefaults = useCallback(() => {
    setTasks(DEFAULT_TASKS)
    setSettings(DEFAULT_SETTINGS)
    setSyncQueue([])
    setDemoTaskIds([])
    nextIdRef.current = -1
    localStorage.removeItem(STORAGE_KEYS.tasks)
    localStorage.removeItem(STORAGE_KEYS.settings)
    localStorage.removeItem(STORAGE_KEYS.syncQueue)
    localStorage.removeItem(STORAGE_KEYS.nextId)
    localStorage.removeItem(DEMO_TASK_IDS_KEY)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(DEMO_TASK_IDS_KEY, JSON.stringify(demoTaskIds))
    }
  }, [demoTaskIds, isInitialized])

  const initDemoData = useCallback(() => {
    const demoTasks = createDemoTasks(nextIdRef)
    localStorage.setItem(STORAGE_KEYS.nextId, JSON.stringify(nextIdRef.current))
    const demoIds = demoTasks.map((t) => t.id)
    setDemoTaskIds(demoIds)
    setTasks((prev) => [...prev, ...demoTasks])
  }, [])

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

  const hasDemoData = demoTaskIds.length > 0 && tasks.some((t) => demoTaskIds.includes(t.id))

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
