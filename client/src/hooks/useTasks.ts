/**
 * @fileoverview Task CRUD operations hooks (for listing, creation, updates,
 * deletion, and status changes, etc.)
 */

import { useMutation } from '@tanstack/react-query'

import { useLocalStateSafe } from '@/components/providers/LocalStateProvider'
import type {
  CreateTask,
  TaskStatus,
  TaskWithSubtasks,
  UpdateTask,
} from '~/shared/schema'

export const useTasks = () => {
  const localState = useLocalStateSafe()

  if (!localState) {
    return {
      data: undefined,
      isLoading: true,
      error: null,
      refetch: () => Promise.resolve(),
    }
  }

  return {
    data: localState.tasks,
    isLoading: !localState.isInitialized,
    error: null,
    refetch: () => Promise.resolve(),
  }
}

export const useTaskParentChain = (parentId?: number) => {
  const { data: tasks } = useTasks()

  if (!parentId || !tasks) return []

  const chain: { id: number; name: string }[] = []
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
    data: tasks ? findTask(tasks, id) : undefined,
    isLoading,
    error: null,
  }
}

export const useCreateTask = () => {
  const localState = useLocalStateSafe()

  return useMutation({
    // biome-ignore lint/suspicious/useAwait: expects a promise
    mutationFn: async (data: Omit<CreateTask, 'userId'>) => {
      if (!localState) {
        throw new Error('Local state not initialized')
      }
      return localState.createTask(data)
    },
  })
}

export const useUpdateTask = () => {
  const localState = useLocalStateSafe()

  return useMutation({
    // biome-ignore lint/suspicious/useAwait: expects a promise
    mutationFn: async ({ id, ...updates }: UpdateTask) => {
      if (!localState) {
        throw new Error('Local state not initialized')
      }
      return localState.updateTask(id, updates)
    },
  })
}

export const useSetTaskStatus = () => {
  const localState = useLocalStateSafe()

  return useMutation({
    // biome-ignore lint/suspicious/useAwait: expects a promise
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      if (!localState) {
        throw new Error('Local state not initialized')
      }
      return localState.setTaskStatus(id, status)
    },
  })
}

export const useDeleteTask = () => {
  const localState = useLocalStateSafe()

  return useMutation({
    // biome-ignore lint/suspicious/useAwait: expects a promise
    mutationFn: async (id: number) => {
      if (!localState) {
        throw new Error('Local state not initialized')
      }
      localState.deleteTask(id)
    },
  })
}
