/**
 * @fileoverview Application-wide constants and configuration values
 */

import {
  DEFAULT_FIELD_CONFIG,
  SortOption,
  type UserSettings,
} from '~/shared/schema'

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
  GUEST: '/guest',
  SETTINGS: '/settings',
  HOW_TO_USE: '/how-to-use',
  HOW_TO_INSTALL: '/how-to-install',
  COMPLETED: '/completed',
} as const
