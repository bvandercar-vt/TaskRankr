/**
 * @fileoverview Hook that walks a task's `parentId` chain to produce a
 * breadcrumb-style ancestor list. Reads from `LocalStateProvider`, optionally
 * including in-flight draft tasks from an active TaskForm session.
 */

import { getById } from '@/lib/task-utils'
import { useLocalState } from '@/providers/LocalStateProvider'
import type { Task } from '~/shared/schema'

interface UseTaskParentChainOptions {
  /** Include in-memory draft tasks from an active TaskForm session.
   *  Defaults to false so app-wide views never see drafts. Form components
   *  opt in. */
  includeDrafts?: boolean
}

export const useTaskParentChain = (
  parentId?: number,
  options?: UseTaskParentChainOptions,
) => {
  const localState = useLocalState()
  const tasks = options?.includeDrafts
    ? localState.tasksWithDrafts
    : localState.tasks

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
