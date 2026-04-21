/**
 * @fileoverview Task CRUD operations hooks. All mutations go through
 * LocalStateProvider which applies changes instantly; SyncProvider
 * handles background server sync.
 */

import { pick } from 'es-toolkit'

import { getById } from '@/lib/task-utils'
import { useLocalState } from '@/providers/LocalStateProvider'
import type { Task, UpdateTask } from '~/shared/schema'

interface UseTasksOptions {
  /** Include in-memory draft tasks from an active TaskForm session.
   *  Defaults to false so app-wide views never see drafts. Form components
   *  opt in. */
  includeDrafts?: boolean
}

export const useTasks = ({ includeDrafts = false }: UseTasksOptions = {}) => {
  const localState = useLocalState()

  return {
    data: includeDrafts ? localState.tasksWithDrafts : localState.tasks,
    isLoading: !localState.isInitialized,
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
    const parent: Task | undefined = getById(tasks, currentId)
    if (parent) {
      chain.unshift({ id: parent.id, name: parent.name })
      currentId = parent.parentId
    } else {
      break
    }
  }

  return chain
}

export const useTaskActions = () => {
  const localState = useLocalState()

  return {
    ...pick(localState, [
      'createTask',
      'setTaskStatus',
      'deleteTask',
      'reorderSubtasks',
    ]),
    updateTask: ({ id, ...updates }: UpdateTask): Task =>
      localState.updateTask(id, updates),
  }
}
