/**
 * @fileoverview Application-wide constants and configuration values
 */

import type { UserSettings } from '~/shared/schema'

export const IconSizeStyle = {
  small: 'h-4 w-4',
  medium: 'h-6 w-6',
} as const

export const DEFAULT_SETTINGS: UserSettings = {
  userId: '',
  autoPinNewTasks: true,
  enableInProgressStatus: true,
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
