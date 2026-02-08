import {
  Ease,
  Enjoyment,
  Priority,
  type RankField,
  SortOption,
  type TaskWithSubtasks,
  Time,
} from '~/shared/schema'

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

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

export const SORT_LABELS: Record<SortOption, string> = {
  date: 'Date Created',
  priority: 'Priority',
  ease: 'Ease',
  enjoyment: 'Enjoyment',
  time: 'Time',
}

const RANK_FIELD_ENUMS: Record<RankField, Record<string, string>> = {
  priority: Priority,
  ease: Ease,
  enjoyment: Enjoyment,
  time: Time,
}

export const SORT_BEST_VALUES: Record<SortOption, string> = {
  date: 'newest',
  ...Object.fromEntries(
    (Object.keys(RANK_FIELD_ENUMS) as RankField[]).map((field) => {
      const values = Object.values(RANK_FIELD_ENUMS[field])
      return [
        field,
        SORT_DIRECTIONS[field] === SortDirection.DESC
          ? values.at(-1)!
          : values.at(0)!,
      ]
    }),
  ),
} as Record<SortOption, string>

export const SORT_CHAINS: Record<SortOption, SortOption[]> = {
  date: [SortOption.DATE],
  priority: [SortOption.PRIORITY, SortOption.EASE, SortOption.ENJOYMENT],
  ease: [SortOption.EASE, SortOption.PRIORITY, SortOption.ENJOYMENT],
  enjoyment: [SortOption.ENJOYMENT, SortOption.PRIORITY, SortOption.EASE],
  time: [SortOption.TIME, SortOption.PRIORITY, SortOption.EASE],
} satisfies { [K in SortOption]: [K, ...SortOption[]] }

export const sortTasks = (
  tasks: TaskWithSubtasks[],
  fields: SortOption[],
): TaskWithSubtasks[] => {
  const sorted = [...tasks]
  sorted.sort((a, b) => {
    for (const field of fields) {
      const cmp = compareByField(a, b, field)
      if (cmp !== 0) return cmp
    }
    return 0
  })
  return sorted
}
