import type { SortOption, UserSettings } from '~/shared/schema'

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
