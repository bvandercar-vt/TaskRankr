/**
 * @fileoverview Sorting logic, sort-chain definitions, and rank-field column
 * metadata for task lists. Single source of truth for sort order, direction,
 * labels, and the "best" value derivation used by `SortInfo`.
 */

import type { ValueOf } from 'type-fest'

import type { TaskWithSubtasks } from '@/types'
import {
  type Ease,
  type Enjoyment,
  type Priority,
  SortOption,
  SubtaskSortMode,
  type Task,
  TaskStatus,
  type Time,
} from '~/shared/schema'

export * from '~/shared/utils/task-utils'

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

// ***************************************************************************
// Everything Else
// ***************************************************************************

/**
 * Collects every descendant of `rootIds` through the `parentId` graph. Pass
 * `includeRoots: true` to also include the roots themselves.
 */
export function collectSubtreeIds(
  tasks: Task[],
  rootIds: Iterable<number>,
  opts: { includeRoots?: boolean } = {},
): Set<number> {
  const result = new Set<number>()
  const rootSet = new Set(rootIds)
  if (opts.includeRoots) {
    rootSet.forEach((id) => {
      result.add(id)
    })
  }
  let frontier: Set<number> = rootSet
  while (frontier.size > 0) {
    const next = new Set<number>()
    for (const t of tasks) {
      if (
        t.parentId !== null &&
        frontier.has(t.parentId) &&
        !result.has(t.id)
      ) {
        result.add(t.id)
        next.add(t.id)
      }
    }
    frontier = next
  }
  return result
}
