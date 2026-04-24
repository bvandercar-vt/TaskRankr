/**
 * @fileoverview Tree-walking helpers + sorting/filtering logic for task
 * lists.
 */

import type { ValueOf } from 'type-fest'
import type { z } from 'zod'

import type { TaskWithSubtasks } from '@/types'
import {
  allRankFieldsNull,
  type Ease,
  type Enjoyment,
  type Priority,
  SortOption,
  SubtaskSortMode,
  type Task,
  taskSchema,
  TaskStatus,
  type Time,
} from '~/shared/schema'
import {
  collectDescendantIds,
  getDirectSubtasks,
} from '~/shared/utils/task-utils'

export * from '~/shared/utils/task-utils'

// *****************************************************************************
// Local-task construction (client-only — drafts and unsynced creates both
// live in-memory with a negative id and `userId: 'local'`).
// *****************************************************************************

/**
 * Build a local-only Task: parses through `taskSchema` after applying the
 * caller-supplied id and status on top of `allRankFieldsNull` defaults.
 * Used by `TasksProvider.createTask` (real but unsynced) and
 * `DraftSessionProvider.createDraftTask` (never persisted). Any `status` on
 * `data` is intentionally overridden by the explicit `status` arg.
 *
 * `data` is typed loosely (`Partial<...>`) because callers pass Drizzle
 * insert-style content where nullable fields appear as `T | null | undefined`
 * — looser than `z.input` accepts. The runtime parse below is the real
 * validation.
 */
export const buildLocalTask = (
  data: Partial<z.input<typeof taskSchema>>,
  id: number,
  status: TaskStatus,
): Task =>
  taskSchema.parse({
    ...allRankFieldsNull,
    ...data,
    id,
    userId: 'local',
    status,
  })

// *****************************************************************************
// Status transitions
// *****************************************************************************

/**
 * Translates a target `TaskStatus` into the timestamp side-effects that
 * accompany the transition: starting `IN_PROGRESS` stamps
 * `inProgressStartedAt`, transitioning to `COMPLETED` stamps `completedAt`
 * and clears the in-progress timer, and any other status just clears the
 * in-progress timer. Used by `setTaskStatus` in both providers.
 */
export const statusToStatusPatch = (status: TaskStatus): Partial<Task> => {
  switch (status) {
    case TaskStatus.IN_PROGRESS:
      return { status, inProgressStartedAt: new Date() }
    case TaskStatus.COMPLETED:
      return { status, completedAt: new Date(), inProgressStartedAt: null }
    default:
      return { status, inProgressStartedAt: null }
  }
}

// *****************************************************************************
// Auto-hide-completed (client-only — server applies its own equivalent
// per-row via DB queries in `server/storage.ts`).
// *****************************************************************************

/**
 * Predicate for the "auto-hide completed" rule: a task should be hidden
 * when it transitions to (or is created as) COMPLETED and its parent has
 * `autoHideCompleted` enabled. Pass `undefined` for `parent` when the task
 * has no parent.
 */
export const shouldAutoHideUnderParent = (
  parent: Task | undefined,
  status: TaskStatus,
): boolean =>
  parent?.autoHideCompleted === true && status === TaskStatus.COMPLETED

/**
 * When a parent's `autoHideCompleted` toggle changes, returns the set of
 * descendant ids whose `hidden` flag should be flipped: every COMPLETED
 * direct child plus all of that child's descendants. Returns an empty set
 * when nothing needs to change.
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

// *****************************************************************************
// Sorting
// *****************************************************************************

const SortBy = { ...SortOption, DATE_COMPLETED: 'date_completed' } as const
type SortBy = ValueOf<typeof SortBy>

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/** Default sort direction per field (DESC = best-first). */
export const SORT_DIRECTIONS: Record<SortBy, SortDirection> = {
  date_created: SortDirection.DESC,
  date_completed: SortDirection.DESC,
  priority: SortDirection.DESC,
  ease: SortDirection.ASC,
  enjoyment: SortDirection.DESC,
  time: SortDirection.ASC,
}

const LEVEL_WEIGHTS = {
  highest: 5,
  hardest: 5,
  high: 4,
  hard: 4,
  medium: 3,
  low: 2,
  easy: 2,
  lowest: 1,
  easiest: 1,
} as const satisfies Record<Priority | Ease | Enjoyment | Time, number>

const getLevelWeight = (
  level: keyof typeof LEVEL_WEIGHTS | null | undefined,
): number => (level ? (LEVEL_WEIGHTS[level] ?? 0) : 0)

/** Compares two tasks by a single field, respecting its sort direction. */
const compareByField = (a: Task, b: Task, field: SortBy): number => {
  if (field === SortBy.DATE_CREATED) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }
  if (field === SortBy.DATE_COMPLETED) {
    return (
      new Date(b.completedAt ?? b.createdAt).getTime() -
      new Date(a.completedAt ?? a.createdAt).getTime()
    )
  }
  const direction = SORT_DIRECTIONS[field]
  const valA = getLevelWeight(a[field])
  const valB = getLevelWeight(b[field])
  return direction === SortDirection.DESC ? valB - valA : valA - valB
}

/** Sorts tasks by a passed sort order of fields; earlier fields take priority.
 *  Completed tasks always sort to the bottom. */
export const sortTasksByField = <T extends Task>(
  tasks: T[],
  fields: SortBy[],
): T[] =>
  [...tasks].sort((a, b) => {
    const aCompleted = a.status === TaskStatus.COMPLETED ? 1 : 0
    const bCompleted = b.status === TaskStatus.COMPLETED ? 1 : 0
    if (aCompleted !== bCompleted) return aCompleted - bCompleted

    for (const field of fields) {
      const cmp = compareByField(a, b, field)
      if (cmp !== 0) return cmp
    }
    return 0
  })

/** Sorts tasks by a passed sort order of ids; earlier ids take priority. */
export const sortTasksByIdOrder = <T extends Task>(
  tasks: T[],
  order: number[],
): T[] =>
  [...tasks].sort((a, b) => {
    const indexA = order.indexOf(a.id)
    const indexB = order.indexOf(b.id)
    return (
      (indexA === -1 ? Number.POSITIVE_INFINITY : indexA) -
      (indexB === -1 ? Number.POSITIVE_INFINITY : indexB)
    )
  })

export const SORT_ORDER_MAP = {
  date_created: [SortBy.DATE_CREATED],
  priority: [SortBy.PRIORITY, SortBy.EASE, SortBy.ENJOYMENT],
  ease: [SortBy.EASE, SortBy.PRIORITY, SortBy.ENJOYMENT],
  enjoyment: [SortBy.ENJOYMENT, SortBy.PRIORITY, SortBy.EASE],
  time: [SortBy.TIME, SortBy.PRIORITY, SortBy.EASE],
} as const satisfies { [K in SortOption]: [K, ...SortBy[]] }

export const sortTaskTree = (
  tasks: TaskWithSubtasks[],
  sort: SortBy[],
  parentSortMode?: SubtaskSortMode,
  parentSubtaskOrder?: number[],
  childSort?: SortBy[],
): TaskWithSubtasks[] => {
  const inheritedSort = childSort ?? sort
  const withSortedChildren = tasks.map((task) => ({
    ...task,
    subtasks: sortTaskTree(
      task.subtasks,
      inheritedSort,
      task.subtaskSortMode,
      task.subtaskOrder,
    ),
  }))

  if (parentSortMode === SubtaskSortMode.MANUAL && parentSubtaskOrder) {
    return sortTasksByIdOrder(withSortedChildren, parentSubtaskOrder)
  }

  return sortTasksByField(withSortedChildren, sort)
}

// *****************************************************************************
// Filtering
// *****************************************************************************

export const filterTaskTree = (
  tasks: TaskWithSubtasks[],
  searchTerm: string,
): TaskWithSubtasks[] => {
  if (!searchTerm) return tasks
  const lower = searchTerm.toLowerCase()
  return tasks.reduce((acc: TaskWithSubtasks[], task) => {
    const matches = task.name.toLowerCase().includes(lower)
    const filteredSubtasks = filterTaskTree(task.subtasks, searchTerm)
    if (matches || filteredSubtasks.length > 0) {
      acc.push({ ...task, subtasks: filteredSubtasks })
    }
    return acc
  }, [])
}

export const filterRootTasks = (tasks: Task[], searchTerm: string): Task[] => {
  if (!searchTerm.trim()) return tasks
  const q = searchTerm.toLowerCase()
  return tasks.filter((task) => task.name.toLowerCase().includes(q))
}

export const filterAndSortTree = (
  tasks: TaskWithSubtasks[],
  searchTerm: string,
  sort: SortBy[],
  childSort?: SortBy[],
) =>
  sortTaskTree(
    filterTaskTree(tasks, searchTerm),
    sort,
    undefined,
    undefined,
    childSort,
  )
