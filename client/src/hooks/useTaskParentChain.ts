/**
 * @fileoverview Hook that walks a task's `parentId` chain to produce a
 * breadcrumb-style ancestor list. Reads from `LocalStateProvider`, optionally
 * including in-flight draft tasks from an active TaskForm session (when
 * `DraftSessionProvider` is mounted above and `includeDrafts` is set).
 */

import { getById } from '@/lib/task-utils'
import { useOptionalDraftSession } from '@/providers/DraftSessionProvider'
import { useLocalState } from '@/providers/LocalStateProvider'
import type { Task } from '~/shared/schema'

interface UseTaskParentChainOptions {
  /** Include in-memory draft tasks from an active TaskForm session.
   *  Defaults to false so app-wide views never see drafts. Form components
   *  opt in. Silently no-ops if no DraftSessionProvider is mounted above. */
  includeDrafts?: boolean
}

export const useTaskParentChain = (
  parentId?: number,
  options?: UseTaskParentChainOptions,
) => {
  const localState = useLocalState()
  const draftSession = useOptionalDraftSession()
  const tasks =
    options?.includeDrafts && draftSession
      ? draftSession.tasksWithDrafts
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
