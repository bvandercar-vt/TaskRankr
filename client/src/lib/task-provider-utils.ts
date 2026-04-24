/**
 * @fileoverview Utils shared by TaskProvider and DraftSessionProvider.
 */

import type { SetRequired } from 'type-fest'
import type { z } from 'zod'

import {
  allRankFieldsNull,
  type Task,
  TaskStatus,
  taskSchema,
} from '~/shared/schema'
import {
  collectDescendantIds,
  getDirectSubtasks,
} from '~/shared/utils/task-utils'

export { shouldAutoHideUnderParent } from '~/shared/utils/task-utils'

/**
 * Build a local-only Task: parses through `taskSchema` after applying the
 * caller-supplied id and status on top of `allRankFieldsNull` defaults.
 */
export const buildLocalTask = (
  data: SetRequired<Partial<z.input<typeof taskSchema>>, 'id' | 'status'>,
): Task =>
  taskSchema.parse({
    ...allRankFieldsNull,
    ...data,
    userId: 'local',
  })

/**
 * Applies the necessary field changes for a task to transition to the given
 * status.
 */
export const statusToStatusPatch = (status: TaskStatus): Partial<Task> => {
  switch (status) {
    case TaskStatus.IN_PROGRESS:
      return { status, inProgressStartedAt: new Date() }
    case TaskStatus.COMPLETED:
      return { status, completedAt: new Date(), inProgressStartedAt: null }
    case TaskStatus.PINNED:
    case TaskStatus.OPEN:
      return { status, inProgressStartedAt: null }
    default:
      throw new Error(`Unhandled status: ${status satisfies never}`)
  }
}

/**
 * When a parent's `autoHideCompleted` toggle changes, returns the set of
 * descendant ids whose `hidden` flag should be flipped.
 */
export const getAutoHideCascadeIds = (
  tasks: Task[],
  parentId: number,
): Set<number> => {
  const completedDirectIds = getDirectSubtasks(tasks, parentId)
    .filter((t) => t.status === TaskStatus.COMPLETED)
    .map((t) => t.id)
  if (completedDirectIds.length === 0) return new Set()
  return collectDescendantIds(tasks, completedDirectIds, { includeRoots: true })
}
