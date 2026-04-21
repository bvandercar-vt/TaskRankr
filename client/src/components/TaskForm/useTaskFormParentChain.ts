/**
 * @fileoverview Hook that walks a task's `parentId` chain to produce a
 * breadcrumb-style ancestor list.
 */

import { getById } from '@/lib/task-tree-utils'
import { useDraftSession } from '@/providers/DraftSessionProvider'
import type { Task } from '~/shared/schema'

export const useTaskFormParentChain = (parentId?: number) => {
  const { tasksWithDrafts: tasks } = useDraftSession()

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
