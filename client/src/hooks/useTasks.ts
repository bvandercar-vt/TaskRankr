/**
 * @fileoverview Task CRUD operations hooks. All mutations go through
 * LocalStateProvider which applies changes instantly; SyncProvider
 * handles background server sync.
 */

import { getTaskById } from '@/lib/task-utils'
import {
  type CreateTaskContent,
  useLocalStateSafe,
} from '@/providers/LocalStateProvider'
import type { Task, UpdateTask } from '~/shared/schema'

export const useTasks = () => {
  const localState = useLocalStateSafe()
  const tasks = localState?.tasks ?? []
  const isLoading = localState ? !localState.isInitialized : true
  return {
    data: tasks,
    isLoading,
    refetch: () => Promise.resolve(),
  }
}

export const useTaskParentChain = (parentId?: number) => {
  const { data: tasks } = useTasks()

  if (!parentId) return []

  const chain: Pick<Task, 'id' | 'name'>[] = []
  let currentId: number | null | undefined = parentId

  while (currentId) {
    const parent = getTaskById(tasks, currentId)
    if (parent) {
      chain.unshift({ id: parent.id, name: parent.name })
      currentId = parent.parentId
    } else {
      break
    }
  }

  return chain
}

export const useTask = (id: number) => {
  const { data: tasks, isLoading } = useTasks()
  return {
    data: getTaskById(tasks, id),
    isLoading,
    error: null,
  }
}

export const useTaskActions = (): {
  createTask: (data: CreateTaskContent) => Task
  updateTask: (update: UpdateTask) => Task
  setTaskStatus: (id: number, status: Task['status']) => Task
  deleteTask: (id: number) => void
  reorderSubtasks: (parentId: number, orderedIds: number[]) => void
} => {
  const localState = useLocalStateSafe()

  if (!localState) {
    const noop = () => {
      throw new Error('Local state not initialized')
    }
    return {
      createTask: noop,
      updateTask: noop,
      setTaskStatus: noop,
      deleteTask: noop,
      reorderSubtasks: noop,
    }
  }

  return {
    createTask: (data) => localState.createTask(data),
    updateTask: ({ id, ...updates }) => localState.updateTask(id, updates),
    setTaskStatus: (id, status) => localState.setTaskStatus(id, status),
    deleteTask: (id) => localState.deleteTask(id),
    reorderSubtasks: (parentId, orderedIds) =>
      localState.reorderSubtasks(parentId, orderedIds),
  }
}
