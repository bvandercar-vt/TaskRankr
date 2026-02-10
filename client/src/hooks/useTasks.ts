/**
 * @fileoverview Task CRUD operations hooks. All mutations go through
 * LocalStateProvider which applies changes instantly; SyncProvider
 * handles background server sync.
 */

import {
  type CreateTaskContent,
  useLocalStateSafe,
} from '@/components/providers/LocalStateProvider'
import type { Task, TaskWithSubtasks, UpdateTask } from '~/shared/schema'

export const useTasks = () => {
  const localState = useLocalStateSafe()
  return {
    data: localState?.tasks ?? [],
    isLoading: localState ? !localState.isInitialized : true,
    error: null,
    refetch: () => Promise.resolve(),
  }
}

export const useTaskParentChain = (parentId?: number) => {
  const { data: tasks } = useTasks()

  if (!parentId) return []

  const chain: Pick<Task, 'id' | 'name'>[] = []
  let currentId: number | null | undefined = parentId

  while (currentId) {
    const parent = tasks.find((t) => t.id === currentId)
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

  const findTask = (
    taskList: TaskWithSubtasks[],
    targetId: number,
  ): TaskWithSubtasks | undefined => {
    for (const task of taskList) {
      if (task.id === targetId) return task
      const found = findTask(task.subtasks, targetId)
      if (found) return found
    }
    return undefined
  }

  return {
    data: findTask(tasks, id),
    isLoading,
    error: null,
  }
}

export const useTaskActions = (): {
  createTask: (data: CreateTaskContent) => TaskWithSubtasks
  updateTask: (update: UpdateTask) => TaskWithSubtasks
  setTaskStatus: (id: number, status: Task['status']) => TaskWithSubtasks
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
