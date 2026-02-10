/**
 * @fileoverview Sorting logic, sort-chain definitions, and rank-field column
 * metadata for task lists. Single source of truth for sort order, direction,
 * labels, and the "best" value derivation used by `SortInfo`.
 */

import type { ValueOf } from 'type-fest'

import {
  Ease,
  Enjoyment,
  Priority,
  type RankField,
  SortOption,
  SubtaskSortMode,
  type TaskWithSubtasks,
  Time,
} from '~/shared/schema'

// *****************************************************************************
// Sorting
// *****************************************************************************

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/** Default sort direction per field (DESC = best-first). */
export const SORT_DIRECTIONS: Record<SortOption, SortDirection> = {
  date: SortDirection.DESC,
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
const compareByField = (
  a: TaskWithSubtasks,
  b: TaskWithSubtasks,
  field: SortOption,
): number => {
  if (field === SortOption.DATE) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }
  const direction = SORT_DIRECTIONS[field]
  const valA = getLevelWeight(a[field])
  const valB = getLevelWeight(b[field])
  return direction === SortDirection.DESC ? valB - valA : valA - valB
}

/** Sorts tasks by a passed sort order; earlier fields take priority. */
export const sortTasks = (
  tasks: TaskWithSubtasks[],
  fields: SortOption[],
): TaskWithSubtasks[] =>
  [...tasks].sort((a, b) => {
    for (const field of fields) {
      const cmp = compareByField(a, b, field)
      if (cmp !== 0) return cmp
    }
    return 0
  })

export const sortTasksByOrder = (
  tasks: TaskWithSubtasks[],
  order: number[],
): TaskWithSubtasks[] =>
  [...tasks].sort((a, b) => {
    const indexA = order.indexOf(a.id)
    const indexB = order.indexOf(b.id)
    return (
      (indexA === -1 ? Number.POSITIVE_INFINITY : indexA) -
      (indexB === -1 ? Number.POSITIVE_INFINITY : indexB)
    )
  })

export const SORT_ORDER_MAP = {
  date: [SortOption.DATE],
  priority: [SortOption.PRIORITY, SortOption.EASE, SortOption.ENJOYMENT],
  ease: [SortOption.EASE, SortOption.PRIORITY, SortOption.ENJOYMENT],
  enjoyment: [SortOption.ENJOYMENT, SortOption.PRIORITY, SortOption.EASE],
  time: [SortOption.TIME, SortOption.PRIORITY, SortOption.EASE],
} as const satisfies { [K in SortOption]: [K, ...SortOption[]] }

export const sortTaskTree = (
  nodes: TaskWithSubtasks[],
  sort: SortOption,
  parentSortMode?: SubtaskSortMode,
  parentSubtaskOrder?: number[],
): TaskWithSubtasks[] => {
  const withSortedChildren = nodes.map((node) => ({
    ...node,
    subtasks: sortTaskTree(
      node.subtasks,
      sort,
      node.subtaskSortMode,
      node.subtaskOrder,
    ),
  }))

  if (parentSortMode === SubtaskSortMode.MANUAL && parentSubtaskOrder) {
    return sortTasksByOrder(withSortedChildren, parentSubtaskOrder)
  }

  return sortTasks(withSortedChildren, SORT_ORDER_MAP[sort])
}

// *****************************************************************************
// Column criteria
// *****************************************************************************

export const RANK_FIELD_ENUMS = {
  priority: Priority,
  ease: Ease,
  enjoyment: Enjoyment,
  time: Time,
} as const satisfies Record<RankField, Record<string, string>>

export type RankFieldValueMap = {
  [K in RankField]: ValueOf<(typeof RANK_FIELD_ENUMS)[K]>
}

export const SORT_LABELS = {
  date: 'Date Created',
  priority: 'Priority',
  ease: 'Ease',
  enjoyment: 'Enjoyment',
  time: 'Time',
} as const satisfies Record<SortOption, string>

/** Rank-field column metadata in display order (name, label, enum values). */
export const RANK_FIELDS_COLUMNS = [
  {
    name: SortOption.PRIORITY,
    label: SORT_LABELS.priority,
    levels: Object.values(Priority),
  },
  {
    name: SortOption.EASE,
    label: SORT_LABELS.ease,
    levels: Object.values(Ease),
  },
  {
    name: SortOption.ENJOYMENT,
    label: SORT_LABELS.enjoyment,
    labelShort: 'Enjoy',
    levels: Object.values(Enjoyment),
  },
  {
    name: SortOption.TIME,
    label: SORT_LABELS.time,
    levels: Object.values(Time),
  },
] as const satisfies {
  name: RankField
  label: string
  labelShort?: string
  levels: readonly string[]
}[]

// *****************************************************************************
// Filtering
// *****************************************************************************

export const filterTasksDeep = (
  nodes: TaskWithSubtasks[],
  term: string,
): TaskWithSubtasks[] => {
  if (!term) return nodes
  const lower = term.toLowerCase()
  return nodes.reduce((acc: TaskWithSubtasks[], node) => {
    const matches = node.name.toLowerCase().includes(lower)
    const filteredSubtasks = filterTasksDeep(node.subtasks, term)
    if (matches || filteredSubtasks.length > 0) {
      acc.push({ ...node, subtasks: filteredSubtasks })
    }
    return acc
  }, [])
}
