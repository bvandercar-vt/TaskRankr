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

interface UseTasksOptions {
  /** Include in-memory draft tasks from an active TaskForm session.
   *  Defaults to false so app-wide views never see drafts. Form components
   *  opt in. */
  includeDrafts?: boolean
}

export const useTasks = ({ includeDrafts = false }: UseTasksOptions = {}) => {
  const ctx = useLocalStateSafe()
  const tasks = ctx ? (includeDrafts ? ctx.tasksWithDrafts : ctx.tasks) : []
  const isLoading = ctx ? !ctx.isInitialized : true
  return {
    data: tasks,
    isLoading,
    refetch: () => Promise.resolve(),
  }
}

export const useTaskParentChain = (
  parentId?: number,
  options?: UseTasksOptions,
) => {
  const { data: tasks } = useTasks(options)

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

export const useTaskActions = (): {
  createTask: (data: CreateTaskContent) => Task
  updateTask: (update: UpdateTask) => Task
  setTaskStatus: (id: number, status: Task['status']) => Task
  deleteTask: (id: number) => void
  reorderSubtasks: (parentId: number, orderedIds: number[]) => void
} => {
  const ctx = useLocalStateSafe()

  if (!ctx) {
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
    createTask: (data) => ctx.createTask(data),
    updateTask: ({ id, ...updates }) => ctx.updateTask(id, updates),
    setTaskStatus: (id, status) => ctx.setTaskStatus(id, status),
    deleteTask: (id) => ctx.deleteTask(id),
    reorderSubtasks: (parentId, orderedIds) =>
      ctx.reorderSubtasks(parentId, orderedIds),
  }
}
