export enum SortOption {
  DATE_CREATED = 'date_created',
  PRIORITY = 'priority',
  EASE = 'ease',
  ENJOYMENT = 'enjoyment',
  TIME = 'time',
}

export const RankField = [
  SortOption.PRIORITY,
  SortOption.EASE,
  SortOption.ENJOYMENT,
  SortOption.TIME,
] as const
export type RankField = (typeof RankField)[number]
