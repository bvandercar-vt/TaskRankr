import type { TaskResponse } from '~/shared/schema'

const demoTasksBase: Omit<TaskResponse, 'id' | 'createdAt' | 'userId'>[] = [
  {
    name: 'High priority demo task',
    description: 'Example description for a high priority task.',
    priority: 'high',
    ease: 'easy',
    enjoyment: 'medium',
    time: 'low',
    parentId: null,
    status: 'pinned',
    inProgressTime: 0,
    inProgressStartedAt: null,
    completedAt: null,
    subtasks: [],
  },
  {
    name: 'Easy demo task',
    description: 'Example description for an easy task.',
    priority: 'medium',
    ease: 'easy',
    enjoyment: 'high',
    time: 'low',
    parentId: null,
    status: 'open',
    inProgressTime: 0,
    inProgressStartedAt: null,
    completedAt: null,
    subtasks: [],
  },
  {
    name: 'Funnest demo task!',
    description: 'Example description. This task is very enjoyable!',
    priority: 'low',
    ease: 'easy',
    enjoyment: 'highest',
    time: 'lowest',
    parentId: null,
    status: 'open',
    inProgressTime: 0,
    inProgressStartedAt: null,
    completedAt: null,
    subtasks: [],
  },
  {
    name: 'Demo task with subtasks',
    description:
      'When editing a task, you can add subtasks to break down complex work.',
    priority: 'low',
    ease: 'medium',
    enjoyment: 'medium',
    time: 'medium',
    parentId: null,
    status: 'open',
    inProgressTime: 0,
    inProgressStartedAt: null,
    completedAt: null,
    subtasks: [],
  },
]

export const createDemoTasks = (nextIdRef: {
  current: number
}): TaskResponse[] => {
  const now = new Date()

  const getNextId = () => {
    const id = nextIdRef.current--
    return id
  }

  const demoTasks: TaskResponse[] = demoTasksBase.map((t, index) => ({
    ...t,
    id: getNextId(),
    userId: 'local',
    createdAt: new Date(now.getTime() - 60_000 * (index + 1)),
  }))

  return demoTasks
}
