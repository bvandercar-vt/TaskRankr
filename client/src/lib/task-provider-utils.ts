/**
 * @fileoverview Utils shared by TaskProvider and DraftSessionProvider.
 */

import type { SetRequired } from 'type-fest'
import type { z } from 'zod'

import { allRankFieldsNull, type Task, taskSchema } from '~/shared/schema'

export { statusToStatusPatch } from '~/shared/utils/task-utils'

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
