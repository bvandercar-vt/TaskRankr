import type { SortOption, UserSettings } from '~/shared/schema'

export const IconSizeStyle = {
  small: 'h-4 w-4',
  medium: 'h-6 w-6',
} as const

export interface AppSettings extends Omit<UserSettings, 'sortBy'> {
  sortBy: SortOption
}

export const DEFAULT_SETTINGS: AppSettings = {
  userId: '',
  autoPinNewTasks: true,
  enableInProgressTime: true,
  alwaysSortPinnedByPriority: true,
  sortBy: 'priority',
  priorityVisible: true,
  priorityRequired: true,
  easeVisible: true,
  easeRequired: true,
  enjoymentVisible: true,
  enjoymentRequired: true,
  timeVisible: true,
  timeRequired: true,
}
