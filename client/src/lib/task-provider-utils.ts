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
import { getDirectSubtasks } from '~/shared/utils/task-utils'

export {
  shouldAutoHideUnderParent,
  statusToStatusPatch,
} from '~/shared/utils/task-utils'

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
 * When a parent's `autoHideCompleted` toggle changes, returns the set of
 * direct-child ids whose `hidden` flag should be flipped — only direct
 * completed children are affected, since a completed parent's descendants
 * have their visibility governed by their own immediate parent's setting.
 */
export const getAutoHideCascadeIds = (
  tasks: Task[],
  parentId: number,
): Set<number> =>
  new Set(
    getDirectSubtasks(tasks, parentId)
      .filter((t) => t.status === TaskStatus.COMPLETED)
      .map((t) => t.id),
  )
