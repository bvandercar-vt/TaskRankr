/**
 * @fileoverview Application-wide constants and configuration values
 */

import {
  DEFAULT_FIELD_CONFIG,
  SortOption,
  type UserSettings,
} from '~/shared/schema'

export const IconSize = {
  HW4: 'h-4 w-4',
  HW5: 'h-5 w-5',
  HW6: 'h-6 w-6',
  HW8: 'h-8 w-8',
} as const

export const DEFAULT_SETTINGS: UserSettings = {
  userId: '',
  autoPinNewTasks: true,
  enableInProgressStatus: true,
  enableInProgressTime: true,
  alwaysSortPinnedByPriority: true,
  sortBy: SortOption.PRIORITY,
  fieldConfig: DEFAULT_FIELD_CONFIG,
}

export const Routes = {
  HOME: '/',
  SETTINGS: '/settings',
  HOW_TO_USE: '/how-to-use',
  COMPLETED: '/completed',
} as const
