import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { TaskResponse } from '~/shared/schema'
import type { AppSettings } from '@/hooks/use-settings'

interface DemoContextValue {
  isDemo: boolean
  enterDemo: () => void
  exitDemo: () => void
  demoTasks: TaskResponse[]
  demoSettings: AppSettings
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

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false)

  const enterDemo = useCallback(() => setIsDemo(true), [])
  const exitDemo = useCallback(() => setIsDemo(false), [])

  const value = useMemo(
    () => ({
      isDemo,
      enterDemo,
      exitDemo,
      demoTasks: DEMO_TASKS,
      demoSettings: DEMO_SETTINGS,
    }),
    [isDemo, enterDemo, exitDemo],
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
  return context ?? { isDemo: false, demoTasks: [], demoSettings: DEMO_SETTINGS }
}
