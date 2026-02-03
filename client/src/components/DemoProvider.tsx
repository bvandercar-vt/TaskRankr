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

type CreateDemoTaskInput = Omit<CreateTaskRequest, 'userId'>

interface DemoContextValue {
  isDemo: boolean
  enterDemo: () => void
  exitDemo: () => void
  demoTasks: TaskResponse[]
  demoSettings: AppSettings
  updateDemoSettings: (updates: Partial<AppSettings>) => void
  createDemoTask: (data: CreateDemoTaskInput) => TaskResponse
  updateDemoTask: (id: number, updates: UpdateTaskRequest) => TaskResponse
  setDemoTaskStatus: (id: number, status: TaskStatus) => TaskResponse
  deleteDemoTask: (id: number) => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

const DEMO_TASKS: TaskResponse[] = [
  {
    id: 1,
    userId: 'demo',
    name: 'Plan vacation itinerary',
    description: 'Research destinations and book flights',
    priority: 'high',
    ease: 'medium',
    enjoyment: 'high',
    time: 'high',
    parentId: null,
    status: 'in_progress',
    inProgressTime: 3600000,
    inProgressStartedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 3),
    completedAt: null,
    subtasks: [],
  },
  {
    id: 2,
    userId: 'demo',
    name: 'Update resume',
    description: 'Add recent projects and skills',
    priority: 'highest',
    ease: 'easy',
    enjoyment: 'medium',
    time: 'medium',
    parentId: null,
    status: 'pinned',
    inProgressTime: 0,
    inProgressStartedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 7),
    completedAt: null,
    subtasks: [],
  },
  {
    id: 3,
    userId: 'demo',
    name: 'Learn TypeScript',
    description: null,
    priority: 'medium',
    ease: 'hard',
    enjoyment: 'highest',
    time: 'high',
    parentId: null,
    status: 'open',
    inProgressTime: 0,
    inProgressStartedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 14),
    completedAt: null,
    subtasks: [
      {
        id: 4,
        userId: 'demo',
        name: 'Complete basics tutorial',
        description: null,
        priority: 'medium',
        ease: 'easy',
        enjoyment: 'high',
        time: 'medium',
        parentId: 3,
        status: 'open',
        inProgressTime: 0,
        inProgressStartedAt: null,
        createdAt: new Date(Date.now() - 86400000 * 14),
        completedAt: null,
        subtasks: [],
      },
      {
        id: 5,
        userId: 'demo',
        name: 'Build a sample project',
        description: null,
        priority: 'low',
        ease: 'medium',
        enjoyment: 'highest',
        time: 'high',
        parentId: 3,
        status: 'open',
        inProgressTime: 0,
        inProgressStartedAt: null,
        createdAt: new Date(Date.now() - 86400000 * 10),
        completedAt: null,
        subtasks: [],
      },
    ],
  },
  {
    id: 6,
    userId: 'demo',
    name: 'Organize garage',
    description: 'Sort through boxes and donate unused items',
    priority: 'low',
    ease: 'hard',
    enjoyment: 'low',
    time: 'high',
    parentId: null,
    status: 'open',
    inProgressTime: 0,
    inProgressStartedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 30),
    completedAt: null,
    subtasks: [],
  },
  {
    id: 7,
    userId: 'demo',
    name: 'Call dentist for appointment',
    description: null,
    priority: 'medium',
    ease: 'easiest',
    enjoyment: 'lowest',
    time: 'lowest',
    parentId: null,
    status: 'open',
    inProgressTime: 0,
    inProgressStartedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 2),
    completedAt: null,
    subtasks: [],
  },
  {
    id: 8,
    userId: 'demo',
    name: 'Read new sci-fi book',
    description: 'Finish by end of month',
    priority: 'lowest',
    ease: 'easiest',
    enjoyment: 'highest',
    time: 'medium',
    parentId: null,
    status: 'open',
    inProgressTime: 0,
    inProgressStartedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 5),
    completedAt: null,
    subtasks: [],
  },
]

const DEMO_SETTINGS: AppSettings = {
  userId: 'demo',
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

const STORAGE_KEYS = {
  tasks: 'taskrankr-demo-tasks',
  settings: 'taskrankr-demo-settings',
  nextId: 'taskrankr-demo-next-id',
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

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false)
  const [demoSettings, setDemoSettings] = useState<AppSettings>(() =>
    loadFromStorage(STORAGE_KEYS.settings, DEMO_SETTINGS),
  )
  const [demoTasks, setDemoTasks] = useState<TaskResponse[]>(() =>
    loadFromStorage(STORAGE_KEYS.tasks, DEMO_TASKS),
  )
  const nextIdRef = useRef(
    loadFromStorage(STORAGE_KEYS.nextId, 100),
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(demoTasks))
  }, [demoTasks])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(demoSettings))
  }, [demoSettings])

  const enterDemo = useCallback(() => setIsDemo(true), [])
  const exitDemo = useCallback(() => setIsDemo(false), [])

  const updateDemoSettings = useCallback((updates: Partial<AppSettings>) => {
    setDemoSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const createDemoTask = useCallback(
    (data: CreateDemoTaskInput): TaskResponse => {
      const newId = nextIdRef.current++
      localStorage.setItem(STORAGE_KEYS.nextId, JSON.stringify(nextIdRef.current))
      const newTask: TaskResponse = {
        id: newId,
        userId: 'demo',
        name: data.name,
        description: data.description ?? null,
        priority: data.priority ?? 'none',
        ease: data.ease ?? 'none',
        enjoyment: data.enjoyment ?? 'none',
        time: data.time ?? 'none',
        parentId: data.parentId ?? null,
        status: demoSettings.autoPinNewTasks ? 'pinned' : 'open',
        inProgressTime: 0,
        inProgressStartedAt: null,
        createdAt: new Date(),
        completedAt: null,
        subtasks: [],
      }
      setDemoTasks((prev) => addTaskToTree(prev, newTask, data.parentId ?? null))
      return newTask
    },
    [demoSettings.autoPinNewTasks],
  )

  const updateDemoTask = useCallback(
    (id: number, updates: UpdateTaskRequest): TaskResponse => {
      let updatedTask: TaskResponse | undefined
      setDemoTasks((prev) =>
        updateTaskInTree(prev, id, (task) => {
          updatedTask = { ...task, ...updates }
          return updatedTask
        }),
      )
      return updatedTask!
    },
    [],
  )

  const setDemoTaskStatus = useCallback(
    (id: number, status: TaskStatus): TaskResponse => {
      let updatedTask: TaskResponse | undefined
      setDemoTasks((prev) => {
        let tasks = prev
        if (status === 'in_progress') {
          tasks = updateTaskInTree(tasks, id, (task) => ({
            ...task,
            status: 'in_progress',
            inProgressStartedAt: new Date(),
          }))
          tasks = tasks.map((t) => {
            if (t.id !== id && t.status === 'in_progress') {
              return { ...t, status: 'pinned' as const, inProgressStartedAt: null }
            }
            return t
          })
        } else if (status === 'completed') {
          tasks = updateTaskInTree(tasks, id, (task) => {
            updatedTask = {
              ...task,
              status: 'completed',
              completedAt: new Date(),
              inProgressStartedAt: null,
            }
            return updatedTask
          })
        } else {
          tasks = updateTaskInTree(tasks, id, (task) => {
            updatedTask = { ...task, status, inProgressStartedAt: null }
            return updatedTask
          })
        }
        if (!updatedTask) {
          updatedTask = findTaskInTree(tasks, id)
        }
        return tasks
      })
      return updatedTask!
    },
    [],
  )

  const deleteDemoTask = useCallback((id: number) => {
    setDemoTasks((prev) => deleteTaskFromTree(prev, id))
  }, [])

  const value = useMemo(
    () => ({
      isDemo,
      enterDemo,
      exitDemo,
      demoTasks,
      demoSettings,
      updateDemoSettings,
      createDemoTask,
      updateDemoTask,
      setDemoTaskStatus,
      deleteDemoTask,
    }),
    [
      isDemo,
      enterDemo,
      exitDemo,
      demoTasks,
      demoSettings,
      updateDemoSettings,
      createDemoTask,
      updateDemoTask,
      setDemoTaskStatus,
      deleteDemoTask,
    ],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export const useDemo = () => {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider')
  }
  return context
}

export const useDemoSafe = () => {
  const context = useContext(DemoContext)
  return (
    context ?? {
      isDemo: false,
      demoTasks: [],
      demoSettings: DEMO_SETTINGS,
      updateDemoSettings: () => {},
      createDemoTask: () => ({} as TaskResponse),
      updateDemoTask: () => ({} as TaskResponse),
      setDemoTaskStatus: () => ({} as TaskResponse),
      deleteDemoTask: () => {},
    }
  )
}
